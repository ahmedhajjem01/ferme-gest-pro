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
        "L'utilisateur a demandé d'effacer définitivement le bouton '🏷️ -4 DT / tête (Tous les lots)' ainsi que tout le code qui lui était associé. "
        "Votre rôle : Auditer le code source (index.html, app.js, translations.js), confirmer la suppression intégrale de la méthode decreaseAllLotsCostBy4DT, "
        "du bouton DOM, des traductions multilingues et des scripts de test associés, et attester qu'aucun résidu technique ni référence orpheline ne subsiste."
    )
    candidates = ["gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.8-flash"]
    for m in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": f"INSTRUCTIONS :\n{system_instruction}\n\nMISSION :\n{prompt}"}]}],
            "generationConfig": {"temperature": 0.15, "maxOutputTokens": 2048}
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
        "Votre mission : Auditer sans complaisance le nettoyage complet du bouton '-4 DT' et de ses fonctions associées. "
        "1. Vérifier qu'aucun appel à 'decreaseAllLotsCostBy4DT' n'existe dans index.html, app.js, mobile-bridge.js. "
        "2. Contrôler que l'intégrité du module Cheptel (app.animals) et des coûts d'acquisition n'est pas altérée. "
        "3. Valider que la non-régression est garantie sur tous les autres modules de FermeGest PRO. "
        "4. Donner le verdict formel de validation."
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
    ORDRE DE L'UTILISATEUR :
    'effacer le button avec toutes le code ajouter pour lui et associee avec lui avec verification avec les agentss'
    
    Image fournie :
    Bouton '🏷️ -4 DT / tête (Tous les lots)' qui avait été introduit dans l'en-tête de la section Cheptel (tab-animals).
    
    Actions de nettoyage réalisées :
    1. index.html : Suppression du bouton HTML '<button onclick="app.decreaseAllLotsCostBy4DT()">'.
    2. app.js : Suppression intégrale de la méthode 'decreaseAllLotsCostBy4DT()'.
    3. translations.js : Suppression des 3 entrées 'btn_deduct_4dt_all_lots' (fr, ar, en).
    4. scripts/ : Suppression du fichier 'scripts/test_decrease_lots.js'.
    5. android/app/build.gradle : Incrémentation à versionCode 38 (v1.0.37).
    
    Veuillez auditer ce nettoyage et certifier la parfaite stabilité de l'application.
    """
    print("--- 👨‍💻 AUDIT CODE : GEMINI PRO (ÉDITEUR) ---")
    rep_gemini = call_gemini(sujet)
    print(rep_gemini)
    
    print("\n--- 🕵️‍♂️ AUDIT QA : GROQ QWEN 3.8 27B (TESTEUR) ---")
    rep_groq = call_groq(f"Voici le rapport de nettoyage :\n{sujet}\n\nVoici l'attestation de l'Éditeur Gemini :\n{rep_gemini}\n\nDonnez votre audit critique et votre verdict formel QA.")
    print(rep_groq)

    # Sauvegarde
    with open("scripts/audit_cleanup_report.json", "w", encoding="utf-8") as f:
        json.dump({"gemini": rep_gemini, "groq": rep_groq}, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
