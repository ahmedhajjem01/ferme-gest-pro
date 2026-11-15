import os
import sys
import json
import urllib.request
import urllib.error
from openai import OpenAI

# Load keys safely from local JSON or env
keys = {}
if os.path.exists("agent_keys.local.json"):
    with open("agent_keys.local.json", "r", encoding="utf-8") as f:
        keys = json.load(f)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", keys.get("GROQ_API_KEY", ""))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", keys.get("GEMINI_API_KEY", ""))

groq_client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

SYSTEM_PROMPT_GEMINI = (
    "Vous êtes l'Éditeur & Architecte Principal de FermeGest PRO (15 ans d'expérience). "
    "L'utilisateur vous demande de concevoir une suite complète et exhaustive de tests automatisés couvrant TOUTE LA SYNCHRONISATION : "
    "1. Synchro bidirectionnelle PC <-> Téléphone en temps réel (Broadcast Realtime). "
    "2. Synchro Hors-ligne vers En-ligne (Event Sourcing des récoltes, ventes, distributions d'aliments). "
    "3. Protection anti-écrasement à 0 et anti-stale data (un appareil obsolète ne peut jamais écraser un appareil frais). "
    "4. Résilience aux pannes réseau et aux erreurs Supabase HTTP 429 (interdiction d'écrasement en cas d'erreur de lecture). "
    "5. Réconciliation comptable en partie double sur les œufs, les aliments et le cheptel. "
    "6. Idempotence des WebSockets et persistance locale complète. "
    "Définissez précisément chaque test avec ses préconditions, actions et assertions."
)

SYSTEM_PROMPT_GROQ = (
    "Vous êtes le Lead QA & Auditeur Sécurité / Concurrence de FermeGest PRO (15 ans d'expérience). "
    "Votre rôle est d'auditer sans complaisance les tests conçus par Gemini : "
    "1. Vérifier si les tests de Gemini couvrent vraiment tous les cas limites de synchronisation multi-appareils. "
    "2. Détecter les failles : conditions de course (race conditions), inversion de paquets réseau, dérive d'horloge (clock drift), idempotence des suppressions (tombstones). "
    "3. Exiger des tests additionnels ultra-critiques pour garantir 0% de perte de données sur le terrain. "
    "4. Donner le verdict formel de validation QA."
)

def call_gemini(prompt: str) -> str:
    candidates = ["gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-3.5-flash"]
    for m in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": f"INSTRUCTIONS :\n{SYSTEM_PROMPT_GEMINI}\n\nMISSION :\n{prompt}"}]}],
            "generationConfig": {"temperature": 0.15, "maxOutputTokens": 2048}
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return f"[Modèle : {m}]\n\n" + data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            continue
    return "[Erreur Gemini API]"

def call_groq(prompt: str) -> str:
    try:
        res = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_GROQ},
                {"role": "user", "content": prompt}
            ],
            temperature=0.15,
            max_tokens=2048
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        return f"[Erreur Groq API] {e}"

def main():
    print("=" * 70)
    print("🚀 DÉBAT DES AGENTS : ÉLABORATION & VÉRIFICATION DES TESTS DE SYNCHRO")
    print("=" * 70)

    sujet_gemini = """
    L'utilisateur ordonne : 'je veux que gemini maintenant faire des test puis groq verifier ces test et reverifier et dernierement antigravity reverifier et faire aussi des test : tous synchronisation'.
    
    Concevez une suite exhaustive de tests de synchronisation pour FermeGest PRO couvrant :
    - La synchronisation Realtime WebSocket sans flapping.
    - La protection contre l'écrasement à 0 lors d'erreurs réseau ou HTTP 429.
    - L'Event Sourcing d'œufs (récoltes simultanées, ventes, couvées, autoconsommation).
    - L'intégrité des stocks d'aliments (distributions partagées).
    - La synchronisation du cheptel et des suppressions tombstones.
    - La préservation du timestamp réel sans falsification.
    """

    print("\n--- 👨‍💻 ÉTAPE 1 : GEMINI PRO CONÇOIT LA SUITE DE TESTS ---")
    tests_gemini = call_gemini(sujet_gemini)
    print(tests_gemini)

    print("\n--- 🕵️‍♂️ ÉTAPE 2 : GROQ QA AUDITE ET REVÉRIFIE LES TESTS ---")
    groq_prompt = f"Voici les tests de synchronisation conçus par Gemini Pro :\n{tests_gemini}\n\nAuditez rigoureusement ces tests, identifiez les failles manquantes, proposez les cas limites additionnels et formulez votre verdict de validation."
    audit_groq = call_groq(groq_prompt)
    print(audit_groq)

    with open("scripts/sync_tests_debate_report.json", "w", encoding="utf-8") as f:
        json.dump({"gemini": tests_gemini, "groq": audit_groq}, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
