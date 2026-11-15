import os
import sys
import json
import urllib.request
import urllib.error
from openai import OpenAI

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

groq_client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

def call_gemini_editor(prompt: str) -> str:
    """Appel à Gemini (3.8 Flash / Pro) en tant qu'Éditeur / Développeur Principal."""
    system_instruction = (
        "Vous êtes l'Éditeur & Développeur Principal de FermeGest PRO (15 ans d'expérience). "
        "Vous êtes expert en UX agricole, comptabilité en partie double (dépenses / stocks) et développement Web/Mobile Capacitor. "
        "Votre rôle est d'analyser le code, d'expliquer pourquoi les deux boutons existaient ('Déclarer un nouvel aliment' vs 'Acheter / Approvisionner'), "
        "d'identifier pourquoi cela déroute l'éleveur, et de concevoir la solution optimale pour unifier ou clarifier l'expérience sans aucune ambiguïté."
    )
    
    candidates = ["gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-pro-preview"]
    for m in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"INSTRUCTIONS SYSTEME :\n{system_instruction}\n\nMISSION :\n{prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048
            }
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return f"[Modèle Gemini utilisé : {m}]\n\n" + data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            continue
            
    return "[Erreur Gemini] Impossible de joindre les modèles Gemini."

def call_groq_tester(prompt: str) -> str:
    """Appel à Groq (Qwen 3.8 27B) en tant que Testeur & Lead QA."""
    system_instruction = (
        "Vous êtes le Lead QA & Testeur en Chef de FermeGest PRO (15 ans d'expérience). "
        "Votre mission est d'auditer sans complaisance les propositions de l'Éditeur Gemini : "
        "1. Vérifier si la solution résout vraiment la confusion de l'éleveur sur les deux boutons. "
        "2. Auditer l'impact sur les 7 modules de l'application (Alimentation, Trésorerie, Cheptel, Œufs, Couveuse, Synchro Cloud, Calendrier). "
        "3. Contrôler les cas limites : Offline-First, reprise des stocks de 50 kg existants, non-régression mobile APK. "
        "4. Donner le verdict formel de validation des tests."
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
        return f"[Erreur Groq Testeur] {e}"

def main():
    print("=" * 70)
    print("🚀 DÉBAT DES 2 AGENTS : GEMINI (ÉDITEUR) VS GROQ (TESTEUR)")
    print("   SUPERVISÉ PAR ANTIGRAVITY SUR FERMEGEST PRO")
    print("=" * 70)
    
    sujet = """
    L'utilisateur éleveur demande : 'Pourquoi utilise deux button d'achat ?'
    Dans le modal 'modalAdjustFeedStock' (Stocks d'Aliments en Réserve), il y a deux boutons côte à côte :
    1. [ + Déclarer un nouvel aliment ] (qui ouvre modalAddFeedType pour créer une référence d'aliment)
    2. [ 🛍️ Acheter / Approvisionner ] (qui ouvre modalAddExpense / openFeedPurchaseModal pour acheter et entrer une dépense)
    
    Problématique :
    - L'éleveur perçoit ces deux boutons comme 'deux boutons d'achat' concurrents et redondants.
    - Dans 'Déclarer un nouvel aliment', l'utilisateur peut aussi entrer un stock initial (kg) et un prix (DT).
    - Dans 'Acheter / Approvisionner', l'utilisateur enregistre une dépense qui augmente le stock en réserve.
    - Comment clarifier, simplifier ou unifier cette interface pour qu'elle soit d'une simplicité totale pour l'éleveur tunisien/francophone tout en respectant la rigueur comptable et la non-régression sur le stock de 50.0 kg ?
    """
    
    print("\n[Étape 1/2] 👨‍💻 Consultation de l'Éditeur Gemini Pro / 3.8 Flash...")
    gemini_rep = call_gemini_editor(sujet)
    print("\n--- 👨‍💻 AVIS & SOLUTION DE L'ÉDITEUR GEMINI ---")
    print(gemini_rep)
    
    print("\n[Étape 2/2] 🕵️‍♂️ Audit & Contre-Expertise par le Testeur Groq (Qwen 3.8 27B)...")
    prompt_qa = f"Voici la problématique posée par l'éleveur :\n{sujet}\n\nVoici l'analyse et la solution proposée par l'Éditeur Gemini :\n{gemini_rep}\n\nEn tant que Lead QA Testeur, auditez cette solution, vérifiez les risques de régression sur les 7 modules et donnez votre verdict."
    groq_rep = call_groq_tester(prompt_qa)
    print("\n--- 🕵️‍♂️ AUDIT & VERDICT DU TESTEUR GROQ ---")
    print(groq_rep)
    
    # Enregistrement dans un fichier d'échange pour mise à jour du journal
    output_data = {
        "gemini": gemini_rep,
        "groq": groq_rep
    }
    with open("scripts/agent_debate_output.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    print("\n✅ Débat terminé et sauvegardé dans scripts/agent_debate_output.json")

if __name__ == "__main__":
    main()
