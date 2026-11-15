import os
import sys
import json
import urllib.request
from openai import OpenAI

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

groq_client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

def call_gemini(prompt: str) -> str:
    system_instruction = (
        "Vous êtes l'Éditeur & Développeur Principal de FermeGest PRO. "
        "L'utilisateur vient d'envoyer une capture d'écran montrant un bug visuel critique dans la bannière du stock magasin : "
        "'Réserve d'aliment en magasin : ~110,000 DT (~100.0 kg) • Orge : 50.0 kg • Aliment ponte : 50.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg... (répété 15 fois !) • Aliment ponte (Bouchon) : 0.0 kg'. "
        "Votre mission : concevoir le correctif complet pour dédupliquer intelligemment les aliments homonymes dans sanitizeFeedTypes, "
        "fusionner leurs stocks sans rien perdre, réassigner les dépenses/distributions associées, et ne jamais afficher d'aliments à 0.0 kg dans la bannière résumé du dashboard."
    )
    candidates = ["gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.8-flash"]
    for m in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": f"INSTRUCTIONS :\n{system_instruction}\n\nMISSION :\n{prompt}"}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return f"[Modèle : {m}]\n" + data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            continue
    return "[Erreur Gemini]"

def call_groq(prompt: str) -> str:
    system_instruction = (
        "Vous êtes le Lead QA & Testeur en Chef de FermeGest PRO. "
        "Votre rôle : Auditer le correctif de Gemini sur la déduplication des aliments et l'affichage de la bannière. "
        "Vérifier : "
        "1. Qu'aucun aliment réel (ex: Orge 50kg, Aliment ponte 50kg) n'est perdu ou écrasé. "
        "2. Que les 15 doublons fantômes à 0.0 kg d'Aliment ponte sont éradiqués. "
        "3. Que la bannière résumé du tableau de bord n'affiche QUE les aliments en stock actif (> 0 kg). "
        "4. Que la synchronisation Supabase (mergeCollections) ne recrée pas ces doublons cross-device."
    )
    try:
        res = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            temperature=0.15,
            max_tokens=2048
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        return f"[Erreur Groq] {e}"

def main():
    sujet = """
    BUG SIGNALÉ SUR L'IMAGE DE L'UTILISATEUR :
    Bannière Résumé du Tableau de Bord :
    'Réserve d'aliment en magasin : ~110,000 DT (~100.0 kg) • Orge : 50.0 kg • Aliment ponte : 50.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte : 0.0 kg • Aliment ponte (Bouchon) : 0.0 kg'
    
    Causes identifiées :
    1. Dans appState.feedTypes, de multiples objets avec le même nom nettoyé 'Aliment ponte' et stockKg = 0 ont été créés lors d'anciennes synchronisations ou dépenses.
    2. Dans renderFarmFeedSummary() (ligne 8841), typesBreakdown itère sur tous les appState.feedTypes sans filtrer les aliments épuisés (stockKg <= 0).
    3. sanitizeFeedTypes() ne dédupliquait pas les aliments de même nom.
    
    Donnez la solution d'ingénierie et le plan de test QA.
    """
    print("--- APPEL GEMINI PRO / 3.8 FLASH (ÉDITEUR) ---")
    rep_gemini = call_gemini(sujet)
    print(rep_gemini)
    
    print("\n--- APPEL GROQ QWEN 3.8 27B (TESTEUR) ---")
    rep_groq = call_groq(f"Voici le problème :\n{sujet}\n\nVoici la solution proposée par Gemini :\n{rep_gemini}\n\nDonnez votre audit critique et vos instructions de test.")
    print(rep_groq)

    # Sauvegarde dans un fichier temporaire
    with open("scripts/debate_feed_duplicates.json", "w", encoding="utf-8") as f:
        json.dump({"gemini": rep_gemini, "groq": rep_groq}, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
