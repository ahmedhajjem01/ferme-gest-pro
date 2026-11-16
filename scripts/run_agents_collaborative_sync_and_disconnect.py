import os
import sys
import json
from openai import OpenAI

# Load keys
keys = {}
if os.path.exists("agent_keys.local.json"):
    with open("agent_keys.local.json", "r", encoding="utf-8") as f:
        keys = json.load(f)

GROQ_KEY = keys.get("GROQ_API_KEY", "")
groq_client = OpenAI(api_key=GROQ_KEY, base_url="https://api.groq.com/openai/v1")

def call_model(model_name: str, system_prompt: str, user_prompt: str) -> str:
    completion = groq_client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.1,
        max_tokens=3500
    )
    return completion.choices[0].message.content.strip()

def main():
    print("=== DÉBAT MULTI-AGENTS : SYNCHRONISATION SOUVERAINE & BOUTON DÉCONNEXION ===")
    
    system_architect = (
        "Tu es l'Architecte Full-Stack Principal de FermeGest PRO (25 ans d'expérience systèmes distribués et applications offline-first). "
        "Tu écris du code JavaScript et HTML/CSS de niveau production, ultra-robuste, sans régression, avec gestion stricte des cas limites."
    )
    
    prompt_architect = """
L'utilisateur a donné deux ordres capitaux :
1. "premierement si un compte va rejoindre une ferme dous ce compte= invitee don il faut recoit les donnee de proprietaire pas donner les donner a la ferme proprietere soit mode invite soit connecter. la synchronisation et la synchronisation et la synchronisation doit etre fixe une et une seul fois cette fois car elle duitre lapplication. donc en tant q'agents avec 25ans dexperience et full stack et le plus intelligent que 10 engenieur en informatique faire la fication et prend ton temps avec les agents nutilise pas les etape , faire lun code, lautre verife si il ya un erreur le coder le corriger et etre verifier autres fois untel the programme work 100%"
2. "ajouter un button pour deconnecter de la ferme partagee : avec les agents"

Tu dois concevoir la solution complète et unifiée :

A. DANS `index.html` :
Améliorer la section `teamPartnerSection` dans le modal Profil (`#modalUserProfile`) :
- Afficher un conteneur élégant et sécurisé lorsque l'utilisateur est en rôle `partner` (associé / invité connecté à une ferme partagée).
- Afficher clairement le code de la ferme connectée, le nom/email du propriétaire, et un bouton bien mis en évidence :
  `<button type="button" id="btnLeaveSharedFarm" class="btn btn-outline-danger btn-full team-leave-btn" onclick="appAuth.leaveSharedFarm()">`
  `🚪 Se déconnecter de la ferme partagée`
  `</button>`
- Ajouter les styles CSS correspondants pour un rendu visuel net, propre et responsive sur mobile et PC.
- Dans `updateProfileModalUI()`, masquer `teamJoinContainer` quand l'utilisateur est déjà `partner`, pour éviter toute confusion.

B. DANS `supabase-client.js` :
1. `joinFarmWithCode(rawCode = null)` :
   - SÉCURITÉ ABSOLUE :
     * Valide le format du code (trim, uppercase, ajoute 'FERME-').
     * Interroge Supabase `user_farms` avec `.contains('data', { farmCode: code })`.
     * Si introuvable ou erreur : toast explicite, abort immédiat, AUCUNE modification locale ou distante.
     * Trouve `ownerRow` (`r.data.farmRole === 'owner'`). Si données vides ou introuvables : abort avec toast.
     * ADOPTION INTÉGRALE : `this.applyCloudData(ownerRow.data, false)` (doMerge = false) pour que l'invité prenne 100% de la ferme du propriétaire.
     * Enregistre `fermegest_farm_code` = code, `fermegest_farm_role` = 'partner', `fermegest_farm_owner_email` = email propriétaire.
     * Nettoie `fermegest_pending_push` (interdit d'envoyer les anciennes données locales vides).
     * Mode Invité (`!this.currentUser`) : ZÉRO écriture dans Supabase.
     * Mode Connecté (`this.currentUser`) : Upsert SEULEMENT après adoption, avec la copie conforme des données adoptées.
     * Abonne à `this.subscribeCollaborativeRealtime()`.
     * Notifie et actualise l'UI.

2. `leaveSharedFarm()` (LE BOUTON SE DÉCONNECTER DE LA FERME PARTAGÉE) :
   - Affiche un dialogue de confirmation (`app.confirmDialog`) : "Voulez-vous vraiment vous déconnecter de cette ferme partagée ? Vous repasserez en mode ferme individuelle indépendante."
   - Repasse `fermegest_farm_role` à 'owner'.
   - Génère un nouveau code de ferme indépendant (`this.generateFarmCode()`).
   - Supprime `fermegest_farm_owner_email`.
   - Se réabonne au canal Realtime propre.
   - Si compte connecté (`this.currentUser`), met à jour sa ligne dans `user_farms` avec le nouveau `farmCode` et `farmRole: 'owner'`.
   - Appelle `this.updateProfileModalUI()`.
   - Affiche un toast : "✅ Vous vous êtes déconnecté de la ferme partagée."

3. `syncNow(showToast = true)` :
   - Priorité absolue au Propriétaire. Un associé ne peut JAMAIS écraser le cheptel du propriétaire avec du vide.
   - Si partner : adopte les données de l'owner.
   - Si owner : intègre les ventes/dépenses/pontes de l'associé mais protège le cheptel.

4. `pushData(showToast = false, force = false)` :
   - Si `!this.currentUser`, return immédiat.
   - Si partner et cheptel local vide, interdiction de pousser un cheptel vide.

5. `broadcastCurrentState()` :
   - Si partner et cheptel local vide, ne pas diffuser d'état vide destructif.

6. `subscribeCollaborativeRealtime()` :
   - Dans le listener `farm_update` : rejeter tout message qui viderait le cheptel local existant sans ordre de reset explicite.

Fournis le code exact et complet pour ces parties.
"""

    print("Étape 1 : Génération du code par l'Architecte (openai/gpt-oss-120b)...")
    code_architect = call_model("openai/gpt-oss-120b", system_architect, prompt_architect)
    print("Code produit avec succès.")

    system_auditor = (
        "Tu es le Lead QA & Auditeur Sécurité Systèmes Critiques de FermeGest PRO (25 ans d'expérience). "
        "Ton rôle est d'analyser le code de l'Architecte de façon impitoyable : "
        "1. Est-ce que le bouton de déconnexion ('leaveSharedFarm') est sécurisé, ergonomique et sans faille ? "
        "2. Est-ce que l'invité (Mode Invité ou Connecté) reçoit 100% des données du propriétaire SANS JAMAIS donner son vide ? "
        "3. Y a-t-il le moindre risque de bug, de crash ou de corruption de données ? "
        "Si tout est parfait et sécurisé, valide avec : VERDICT: 100% APPROVED. "
        "Sinon, donne les corrections exactes."
    )

    prompt_auditor = f"""
Voici la proposition complète de code et d'architecture de l'Architecte :

{code_architect}

Procède à l'audit complet et sans concession.
"""

    print("Étape 2 : Audit de sécurité par le Lead QA (qwen/qwen3.8-27b)...")
    verdict_auditor = call_model("qwen/qwen3.8-27b", system_auditor, prompt_auditor)
    print("Audit terminé.")

    status = "APPROVED" if "VERDICT: 100% APPROVED" in verdict_auditor or "100% APPROVED" in verdict_auditor else "NEEDS_REFINEMENT"

    result = {
        "status": status,
        "code_architect": code_architect,
        "audit_verdict": verdict_auditor
    }

    if status != "APPROVED":
        print("Affinage requis par l'auditeur. Étape 3 : Raffinement...")
        prompt_refine = f"""
L'Auditeur QA a relevé les remarques suivantes sur ton code :

{verdict_auditor}

Corrige chaque point soulevé et fournis la version finale irréprochable du code.
"""
        final_code = call_model("openai/gpt-oss-120b", system_architect, prompt_refine)
        result["final_code"] = final_code

        prompt_final_audit = f"""
Voici la version finale corrigée :

{final_code}

Confirme si tout est 100% sécurisé et valide avec : VERDICT: 100% APPROVED.
"""
        final_verdict = call_model("qwen/qwen3.8-27b", system_auditor, prompt_final_audit)
        result["final_verdict"] = final_verdict
        result["status"] = "APPROVED" if "APPROVED" in final_verdict else "REFINED"

    with open("scripts/collaborative_sync_and_disconnect_consensus.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print("Consensus final enregistré dans scripts/collaborative_sync_and_disconnect_consensus.json")
    print("Statut:", result["status"])

if __name__ == "__main__":
    main()
