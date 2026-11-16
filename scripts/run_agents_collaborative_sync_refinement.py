import os
import sys
import json
import urllib.request
import urllib.error
from openai import OpenAI

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
    "Vous êtes l'Architecte Full-Stack Principal de FermeGest PRO. "
    "Vous devez fournir le code JavaScript précis et complet pour `supabase-client.js` résolvant définitivement la synchronisation collaborative et l'adhésion à une ferme : "
    "1. `joinFarmWithCode()` : SÉCURISÉ, ATOMIQUE, SOUVERAIN. "
    "   - Validation du code. "
    "   - Recherche de la ferme dans `user_farms`. Si introuvable : arrêt propre, toast d'erreur, ZÉRO modification locale ou distante. "
    "   - Si trouvée : extraction de la ligne Propriétaire (`farmRole === 'owner'`). "
    "   - Adoption intégrale (`applyCloudData(ownerData, false)`) : le compte invité prend l'état du propriétaire à 100%. "
    "   - En Mode Invité (`this.currentUser == null`) : ZÉRO upsert dans Supabase ! Sauvegarde locale + abonnement Realtime collaboratif uniquement. "
    "   - En Mode Connecté (`this.currentUser != null`) : enregistrement de l'adhésion avec les données adoptées du propriétaire (jamais de données vides antérieures). "
    "2. `syncNow()` : Le Propriétaire est SOUVERAIN. Un partenaire ou invité ne peut jamais écraser le cheptel du propriétaire avec du vide. "
    "3. `pushData()` : Guardrail absolu `if (!this.currentUser) return;`. Un partenaire ne peut jamais pousser d'état destructif. "
    "4. `broadcastCurrentState()` : Ne jamais diffuser d'état vide vers la ferme partagée si le propriétaire a des données."
)

SYSTEM_PROMPT_GROQ = (
    "Vous êtes le Lead QA & Auditeur Sécurité Systèmes Critiques. "
    "Votre rôle est d'analyser le code fourni par Gemini : "
    "1. Vérifier si chaque point de vulnérabilité est éliminé (Mode Invité, Mode Connecté, Concurrence, Écrasement à 0). "
    "2. Donner votre approbation formelle (APPROVED) ou vos dernières corrections."
)

def call_gemini(prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": f"INSTRUCTIONS :\n{SYSTEM_PROMPT_GEMINI}\n\nMISSION :\n{prompt}"}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4096}
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()

def call_groq(prompt: str) -> str:
    models = ["qwen/qwen3.8-27b", "llama-3.1-8b-instant"]
    for m in models:
        try:
            completion = groq_client.chat.completions.create(
                model=m,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_GROQ},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2500
            )
            return completion.choices[0].message.content.strip()
        except Exception:
            continue
    return "[Erreur Groq API]"

def main():
    print("=== DÉBAT MULTI-AGENTS PHASE 2 : CODE EXACT & AUDIT DÉFINITIF ===")
    prompt_gem = "Rédigez l'implémentation complète des méthodes `joinFarmWithCode`, `leaveSharedFarm`, `syncNow`, `pushData` et `broadcastCurrentState` pour `supabase-client.js`. Respectez scrupuleusement la règle : L'invité (Mode Invité ou Connecté) REÇOIT les données du propriétaire, et NE DONNE JAMAIS son vide à la ferme propriétaire !"
    gem_code = call_gemini(prompt_gem)
    print("Gemini Pro a généré le code complet.")
    
    prompt_q = f"Voici le code produit par Gemini Pro :\n\n{gem_code}\n\nAuditez ce code : Élimine-t-il 100% du risque ? Donnez votre verdict."
    groq_verdict = call_groq(prompt_q)
    print("Groq QA a rendu son verdict.")
    
    with open("scripts/collaborative_sync_final_debate.json", "w", encoding="utf-8") as f:
        json.dump({"code": gem_code, "audit": groq_verdict}, f, indent=2, ensure_ascii=False)
        
    print("Rapport enregistré dans scripts/collaborative_sync_final_debate.json")

if __name__ == "__main__":
    main()
