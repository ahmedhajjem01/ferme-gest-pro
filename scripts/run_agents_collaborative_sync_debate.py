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
    "Vous êtes l'Éditeur & Architecte Full-Stack Principal de FermeGest PRO (25 ans d'expérience, expert systèmes distribués et synchronisation concurrente). "
    "L'utilisateur donne cette directive capitale : \n"
    "'premierement si un compte va rejoindre une ferme dous ce compte= invitee don il faut recoit les donnee de proprietaire pas donner les donner a la ferme proprietere soit mode invite soit connecter. "
    "La synchronisation et la synchronisation et la synchronisation doit etre fixe une et une seul fois cette fois car elle duitre lapplication. "
    "Donc en tant q'agents avec 25ans dexperience et full stack et le plus intelligent que 10 engenieur en informatique faire la fication et prend ton temps avec les agents nutilise pas les etape , faire lun code, lautre verife si il ya un erreur le coder le corriger et etre verifier autres fois untel the programme work 100%'.\n\n"
    "Votre mission : Concevoir la solution définitive, inviolable et mathématiquement prouvée pour :\n"
    "1. RÉCEPTION SOUVERAINE DES DONNÉES DU PROPRIÉTAIRE : Lorsqu'un utilisateur rejoint une ferme avec un farmCode (que ce soit en Mode Invité sans compte ou en Mode Connecté avec un compte), il est STRICTEMENT INVITÉ/ASSOCIÉ. Il doit RECEVOIR à 100% les données du propriétaire (`doMerge: false`, remplacement total du vide local par le cheptel, les récoltes, les stocks et les finances du propriétaire). Il est FORMELLEMENT INTERDIT de pousser l'état local vierge/incomplet de l'invité vers la ferme du propriétaire !\n"
    "2. ERADICATION DU BUG D'UPSERT PRÉCOCE DANS `joinFarmWithCode` : Dans le code actuel, `joinFarmWithCode` faisait un upsert de son état local avant même d'avoir lu la ferme du propriétaire, ce qui créait une ligne vide avec un timestamp plus récent qui écrasait la ferme du propriétaire ! Expliquer la correction atomique.\n"
    "3. GESTION STRICTE DU MODE INVITÉ (NON CONNECTÉ) : En mode invité, l'utilisateur qui entre un code de ferme doit pouvoir charger en lecture/consultation/action locale la ferme du propriétaire et s'abonner au canal Realtime sans jamais écrire de ligne corrompue dans Supabase.\n"
    "4. SOUVERAINETÉ DU PROPRIÉTAIRE DANS `syncNow` & `applyCloudData` : La ligne du propriétaire (`farmRole === 'owner'`) est la vérité canonique. Un associé/invité ne peut JAMAIS écraser la liste des animaux, les catégories d'œufs ou les types d'aliments du propriétaire avec un tableau vide. Les contributions d'un associé (ex: saisie d'une récolte d'œufs ou d'un nourrissage) s'additionnent par Event Sourcing sans jamais écraser le socle.\n"
    "Fournissez votre spécification architecturale et les modifications de code exactes."
)

SYSTEM_PROMPT_GROQ = (
    "Vous êtes le Lead QA & Auditeur Sécurité / Concurrence de FermeGest PRO (25 ans d'expérience, spécialisé en tolérance aux pannes, cohérence des données et systèmes critiques). "
    "Votre rôle est d'auditer sans concession la proposition de Gemini pour garantir que la synchronisation et le mécanisme 'Rejoindre une ferme' sont 100% fiables et indestructibles :\n"
    "1. Analyse des risques extrêmes : que se passe-t-il si un invité entre un code inexistant ? Si l'invité a des données locales antérieures ? Si l'invité effectue une récolte hors-ligne puis se connecte ?\n"
    "2. Concurrence Propriétaire <-> Invité : Vérifier qu'en AUCUN CAS l'invité ne peut injecter un état à 0 ou écraser les animaux du propriétaire.\n"
    "3. Mode Invité vs Mode Connecté : Vérifier que les deux modes fonctionnent sans bug, sans exception non gérée (ex: `currentUser` null) et sans boucle d'écrasement.\n"
    "4. Exiger une suite complète de tests de validation (tests unitaires et d'intégration) prouvant que le problème est résolu définitivement.\n"
    "5. Rendre votre verdict formel."
)

def call_gemini(prompt: str) -> str:
    candidates = ["gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-3.5-flash"]
    for m in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": f"INSTRUCTIONS :\n{SYSTEM_PROMPT_GEMINI}\n\nMISSION :\n{prompt}"}]}],
            "generationConfig": {"temperature": 0.15, "maxOutputTokens": 2500}
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return f"[Modèle : {m}]\n\n" + data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            continue
    return "[Erreur Gemini API]"

def call_groq(prompt: str) -> str:
    models = ["qwen/qwen3.8-27b", "llama-3.1-8b-instant", "llama3-70b-8192"]
    for m in models:
        try:
            completion = groq_client.chat.completions.create(
                model=m,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_GROQ},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.15,
                max_tokens=2500
            )
            return f"[Modèle : {m}]\n\n" + completion.choices[0].message.content.strip()
        except Exception:
            continue
    return "[Erreur Groq API]"

def main():
    print("=== DÉBAT MULTI-AGENTS : SYNCHRONISATION DÉFINITIVE & RÈGLE SOUVERAINE PROPRIÉTAIRE / INVITÉ ===")
    
    prompt_gemini = (
        "L'utilisateur a identifié le dysfonctionnement majeur de la synchronisation : "
        "Lorsqu'un compte rejoint une ferme (en Mode Invité ou Mode Connecté), ce compte est un INVITÉ. "
        "Il doit impérativement RECEVOIR les données du propriétaire, et JAMAIS donner/écraser les données du propriétaire avec ses données locales ! "
        "Proposez la correction intégrale dans `supabase-client.js` :\n"
        "1. Refonte complète de `joinFarmWithCode` (suppression de l'upsert précoce, extraction prioritaire de la ligne 'owner', adoption intégrale locale `doMerge=false`).\n"
        "2. Prise en charge sans faille du Mode Invité (`this.currentUser == null`) : lecture seule du propriétaire, activation du broadcast, pas d'écriture RLS destructive.\n"
        "3. Protection souveraine dans `syncNow()` : identifier la ligne canonique du propriétaire (`farmRole === 'owner'`) et interdire à une ligne partenaire de primer sur le cheptel du propriétaire.\n"
        "4. Protection dans `broadcastCurrentState()` : un invité/associé ne diffuse jamais un état vide.\n"
        "5. Présentez le code exact à implémenter."
    )
    
    print("\n>>> Phase 1 : Spécification Architecturale par Gemini Pro...")
    gemini_resp = call_gemini(prompt_gemini)
    print("Gemini Pro a produit sa spécification.")
    
    prompt_groq = (
        f"Voici la spécification architecturale et le code proposés par Gemini Pro :\n\n"
        f"---------------------------\n{gemini_resp}\n---------------------------\n\n"
        "En tant que Lead QA & Auditeur Sécurité / Concurrence :\n"
        "1. Auditez cette proposition ligne par ligne : élimine-t-elle à 100% le risque d'écrasement de la ferme du propriétaire par un invité ?\n"
        "2. Que se passe-t-il dans les cas limites : invité hors-ligne, code erroné, invité qui saisit des œufs puis synchronise, propriétaire qui met à 0 ?\n"
        "3. Validez-vous formellement cette architecture ? Quelles vérifications et tests automatisés imposez-vous à Antigravity ?"
    )
    
    print("\n>>> Phase 2 : Audit & Contre-expertise de Sécurité par Groq QA...")
    groq_resp = call_groq(prompt_groq)
    print("Groq QA a terminé son audit.")
    
    report = {
        "gemini_architecture": gemini_resp,
        "groq_qa_audit": groq_resp
    }
    
    with open("scripts/collaborative_sync_debate_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        
    print("\n=== RAPPORT MULTI-AGENTS ENREGISTRÉ DANS scripts/collaborative_sync_debate_report.json ===")

if __name__ == "__main__":
    main()
