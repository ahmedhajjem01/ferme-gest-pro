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
    "L'utilisateur demande : 'ajouter button mettre a 0 dans le menu de profil : en utilisant les agents et ton verification apres eux'. "
    "Votre mission : Concevoir l'architecture complète, ergonomique et technique de la 'Remise à zéro de la ferme' (Mettre à 0) dans le profil utilisateur : "
    "1. Emplacement exact et UX dans `modalUserProfile` (Zone de Danger stylisée, avertissement clair). "
    "2. Procédure de double confirmation (Dialogue de confirmation sécurisé `app.confirmDialog` pour éviter tout clic accidentel). "
    "3. Étendue exacte de la réinitialisation : quelles données sont remises à 0 (animaux, stocks d'œufs, pontes, consommations, ventes, dépenses, aliments, incubateurs) et quelles données ESSENTIELLES sont impérativement préservées (compte utilisateur, session Supabase, code d'équipe farmCode, rôle farmRole, langue, thème). "
    "4. Synchronisation avec le Cloud Supabase : comment pousser cet état à 0 propre vers Supabase sans déclencher d'erreur 429 et avec le drapeau `_resetCleared: true` pour éviter que les autres appareils ne ressuscitent d'anciennes données. "
    "5. Bouton additionnel de secours 'Vider le cache & Actualiser' pour forcer la mise à jour immédiate sur PC sans manipulation complexe. "
    "Fournissez votre spécification architecturale détaillée."
)

SYSTEM_PROMPT_GROQ = (
    "Vous êtes le Lead QA & Auditeur Sécurité / Concurrence de FermeGest PRO (15 ans d'expérience). "
    "Votre rôle est d'auditer sans concession la proposition de Gemini pour le bouton 'Mettre à 0' : "
    "1. Analyse des failles de sécurité : risque de réinitialisation accidentelle, perte de session utilisateur, déconnexion involontaire. "
    "2. Concurrence & Synchronisation Cloud : Que se passe-t-il si un autre appareil (ex: téléphone) est en ligne au même moment ? Comment garantir qu'une ancienne version en cache locale ne vienne pas écraser l'état remis à 0 ? "
    "3. Audit hors-ligne / en-ligne : Que faire si la remise à 0 est effectuée hors-ligne puis reconnectée ? "
    "4. Exigences de tests automatisés : Quels scénarios de test rigoureux exiger pour valider la fonctionnalité à 100% ? "
    "5. Formuler votre verdict formel d'audit."
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
                max_tokens=2048
            )
            return f"[Modèle : {m}]\n\n" + completion.choices[0].message.content.strip()
        except Exception as e:
            continue
    return "[Erreur Groq API]"

def main():
    print("=== DÉBAT MULTI-AGENTS : BOUTON 'METTRE À 0' DANS LE MENU DE PROFIL ===")
    
    prompt_gemini = (
        "L'utilisateur a demandé d'ajouter un bouton 'Mettre à 0' dans le menu de profil. "
        "En tant qu'Éditeur & Architecte, présentez votre plan d'implémentation complet : "
        "- Structure HTML dans `modalUserProfile` (Zone de Danger). "
        "- Traduction i18n (`translations.js`) en FR, AR, EN. "
        "- Logique JavaScript dans `app.js` (`confirmResetFarmData` et `resetFarmDataToZero`). "
        "- Synchronisation Cloud Supabase et isolation des données d'authentification. "
        "- Gestion du cache navigateur (bouton d'actualisation forcée et purge Service Worker)."
    )
    
    print("\n>>> Phase 1 : Proposition de l'Éditeur & Architecte (Gemini Pro)...")
    gemini_resp = call_gemini(prompt_gemini)
    print("Gemini Pro a formulé sa proposition.")
    
    prompt_groq = (
        f"Voici la proposition d'architecture formulée par Gemini :\n\n"
        f"---------------------------\n{gemini_resp}\n---------------------------\n\n"
        "En tant que Lead QA & Auditeur Sécurité, examinez cette proposition : "
        "1. Quels sont les points forts et les risques potentiels ? "
        "2. Quelles garanties supplémentaires exigez-vous pour la synchronisation multi-appareils et la protection anti-perte de session ? "
        "3. Définissez la liste des tests obligatoires que l'agent Antigravity devra exécuter. "
        "4. Quel est votre verdict formel ?"
    )
    
    print("\n>>> Phase 2 : Audit & Contre-expertise QA (Groq Llama 3.3 70B)...")
    groq_resp = call_groq(prompt_groq)
    print("Groq QA a terminé son audit.")
    
    report = {
        "gemini_proposal": gemini_resp,
        "groq_audit": groq_resp
    }
    
    with open("scripts/reset_farm_debate_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        
    print("\n=== RAPPORT DE DÉBAT ENREGISTRÉ DANS scripts/reset_farm_debate_report.json ===")

if __name__ == "__main__":
    main()
