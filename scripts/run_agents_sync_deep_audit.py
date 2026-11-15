import os
import sys
import json
import urllib.request
import urllib.error
from openai import OpenAI

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

groq_client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

SYSTEM_PROMPT_GEMINI_EDITOR = (
    "Vous êtes l'Éditeur & Architecte Principal de FermeGest PRO (15 ans d'expérience en architecture distribuée, WebSockets Realtime et Offline-First). "
    "L'utilisateur signale que la synchronisation multi-appareils (PC et Téléphone) rencontre encore des blocages et que le stock retombe à 0 ou se désynchronise. "
    "Votre mission : Analyser en profondeur le cycle de synchronisation Supabase, le problème d'erreur 429 Too Many Requests sur auth/v1/user, "
    "le flapping des canaux Realtime (CLOSED -> SUBSCRIBED), le push inconditionnel de syncNow qui écrase la base si la lecture échoue, "
    "et les failles de sérialisation d'eggConsumptions et lastUpdated. Proposer la correction chirurgicale définitive."
)

SYSTEM_PROMPT_GROQ_TESTER = (
    "Vous êtes le Lead QA & Auditeur Sécurité et Concurrence de FermeGest PRO (15 ans d'expérience). "
    "Votre mission : Auditer sans complaisance les propositions de l'Éditeur Gemini : "
    "1. Valider l'élimination définitive de l'erreur 429 Too Many Requests (éradication des appels updateUser en boucle). "
    "2. Valider la stabilisation des WebSockets Realtime (arrêt du tearing down intempestif des canaux). "
    "3. Valider la protection absolue contre l'écrasement du Cloud lors d'erreurs réseau de lecture. "
    "4. Valider l'intégrité comptable de l'Event Sourcing des œufs et le recalibrage automatique. "
    "Donner le verdict formel et les scénarios de test d'acceptation."
)

def call_gemini(prompt: str) -> str:
    candidates = ["gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-3.5-flash"]
    for m in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"INSTRUCTIONS SYSTÈME :\n{SYSTEM_PROMPT_GEMINI_EDITOR}\n\nMISSION :\n{prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.15,
                "maxOutputTokens": 2048
            }
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return f"[Modèle : {m}]\n\n" + data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            continue
    return "[Erreur Gemini API]"

def call_groq(prompt: str) -> str:
    try:
        res = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_GROQ_TESTER},
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
    print("🚀 DÉBAT MULTI-AGENTS : DIAGNOSTIC & RÉSOLUTION FINALE SYNCHRONISATION")
    print("=" * 70)

    sujet = """
    ANOMALIE OBSERVÉE DANS LA CONSOLE DEVTOOLS DE L'UTILISATEUR :
    1. 'Failed to load resource: the server responded with a status of 429 () .../auth/v1/user:1'
    2. Boucle infinie d'abonnements Realtime :
       [Realtime] Subscription status for shared_farm_realtime_FERME-J5PY: CLOSED
       [UserSync] Subscribed to user_device_sync_...: CLOSED
       [CollabRoom] Subscribed to FERME-J5PY: CLOSED
       Failed to load resource: the server responded with a status of 429 () .../auth/v1/user:1
       [Realtime] Subscription status for shared_farm_realtime_FERME-J5PY: SUBSCRIBED
       [UserSync] Subscribed to user_device_sync_...: SUBSCRIBED
       [CollabRoom] Subscribed to FERME-J5PY: SUBSCRIBED
       (se répète en boucle permanente)
    3. Conséquence :
       Quand l'éleveur récolte des œufs sur son téléphone, sur PC le stock tombe à 0 ou le téléphone retombe à 0.
    
    CAUSES IDENTIFIÉES DANS LE CODE :
    1. Boucle mortelle updateUser : pushData() appelait this.client.auth.updateUser(), qui déclenchait l'événement onAuthStateChange('USER_UPDATED'), qui appelait handleAuthStateChange(), qui rappelait updateUser() et syncNow(), qui rappelait pushData() -> Explosion du quota Supabase (HTTP 429).
    2. Destruction/Reconnexion perpétuelle des canaux : handleAuthStateChange() détruisait et recréait tous les WebSockets sur chaque événement auth même mineur (USER_UPDATED / TOKEN_REFRESHED).
    3. Écrasement Cloud lors d'échec de lecture : Dans syncNow(), si le select('user_farms') échoue à cause de l'erreur 429 ou réseau (userRowErr), ownRow reste null, rows reste vide, aucun pull n'est fait, mais le code sautait directement à l'étape 2 (Push) et écrasait la ligne Cloud avec le stock local 0 du PC !
    4. Omission de sérialisation : applyCloudData() ne sérialisait pas eggConsumptions, lastUpdated et deletedEggCategories dans fermegest_state lors de la sauvegarde locale.
    5. calcRichness() dans app.js : n'incluait pas eggHarvests, traitant les fermes à œufs comme 'vides'.
    """

    print("\n--- 👨‍💻 1. PROPOSITION TECHNIQUE : GEMINI PRO (ÉDITEUR) ---")
    rep_gemini = call_gemini(sujet)
    print(rep_gemini)

    print("\n--- 🕵️‍♂️ 2. AUDIT CRITIQUE QA : GROQ QWEN 3.8 27B (TESTEUR) ---")
    qa_input = f"Voici le diagnostic du problème :\n{sujet}\n\nVoici la solution proposée par l'Éditeur Gemini Pro :\n{rep_gemini}\n\nDonnez votre audit critique, vos exigences de blindage et votre verdict."
    rep_groq = call_groq(qa_input)
    print(rep_groq)

    # Sauvegarder dans un JSON pour analyse
    with open("scripts/sync_deep_audit_report.json", "w", encoding="utf-8") as f:
        json.dump({"gemini": rep_gemini, "groq": rep_groq}, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
