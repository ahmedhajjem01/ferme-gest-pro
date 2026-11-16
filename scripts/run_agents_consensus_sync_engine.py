import os
import sys
import json
import urllib.request
from openai import OpenAI

# Load keys
keys = {}
if os.path.exists("agent_keys.local.json"):
    with open("agent_keys.local.json", "r", encoding="utf-8") as f:
        keys = json.load(f)

GEMINI_KEY = keys.get("GEMINI_API_KEY", "")
GROQ_KEY = keys.get("GROQ_API_KEY", "")

groq_client = OpenAI(api_key=GROQ_KEY, base_url="https://api.groq.com/openai/v1")

def call_gemini(prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={GEMINI_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4500}
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()

def call_groq(prompt: str) -> str:
    completion = groq_client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": "Tu es le Lead QA & Auditeur Sécurité Systèmes Critiques de FermeGest PRO (25 ans d'expérience full-stack et systèmes distribués). Tu es intraitable sur la sécurité des données et la synchronisation collaborative sans perte."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=3500
    )
    return completion.choices[0].message.content.strip()

def main():
    print("=== DÉBUT DU CYCLE COLLABORATIF MULTI-AGENTS ===")
    
    coder_prompt = """
Tu es l'Architecte Full-Stack Principal de FermeGest PRO.
L'utilisateur a donné l'ordre absolu suivant :
"premierement si un compte va rejoindre une ferme dous ce compte= invitee don il faut recoit les donnee de proprietaire pas donner les donner a la ferme proprietere soit mode invite soit connecter. la synchronisation et la synchronisation et la synchronisation doit etre fixe une et une seul fois cette fois car elle duitre lapplication. donc en tant q'agents avec 25ans dexperience et full stack et le plus intelligent que 10 engenieur en informatique faire la fication et prend ton temps avec les agents nutilise pas les etape , faire lun code, lautre verife si il ya un erreur le coder le corriger et etre verifier autres fois untel the programme work 100%"

Tu dois concevoir et coder le remplacement exact des fonctions de synchronisation et d'adhésion dans `supabase-client.js`.
Voici le contexte de `supabase-client.js` :
- L'objet gère l'état via `this.getAppState()`, `this.applyCloudData(data, doMerge)`, `this.getFarmCode()`, `this.getFarmRole()`, `this.client` (l'instance supabase-js), `this.currentUser` (l'utilisateur connecté ou null si Mode Invité).
- `localStorage` contient: 'fermegest_farm_code', 'fermegest_farm_role', 'fermegest_farm_owner_email', 'fermegest_pending_push'.

Exigences impératives :
1. `joinFarmWithCode(rawCode = null)` :
   - Récupérer le code depuis l'argument ou l'input `#teamJoinCodeInput`.
   - Normaliser : trim, uppercase, préfixer par 'FERME-' si manquant. Si vide ou invalide : toast d'erreur, return false.
   - INTERROGATION PRÉALABLE DU CLOUD :
     Interroger `user_farms` avec `.contains('data', { farmCode: code })`.
     Si erreur ou si aucun enregistrement trouvé : afficher un toast explicite ("Code de ferme introuvable. Demandez le code au propriétaire."), et ABORTER IMMÉDIATEMENT sans toucher ni au localStorage ni à la base de données !
   - EXTRACTION DU PROPRIÉTAIRE CANONIQUE :
     Rechercher dans les lignes trouvées celle dont le rôle est 'owner' (`r.data && (r.data.farmRole === 'owner' || !r.data.farmRole)`).
     Si aucune ligne propriétaire valide ou si `ownerRow.data` est vide : toast d'erreur, abort.
   - ADOPTION SOUVERAINE IMMÉDIATE (L'INVITÉ REÇOIT LES DONNÉES) :
     Appliquer directement les données du propriétaire : `this.applyCloudData(ownerRow.data, false)` (doMerge = false pour remplacer intégralement l'état local vierge par la ferme du propriétaire).
   - ENREGISTREMENT DES MÉTADONNÉES :
     `localStorage.setItem('fermegest_farm_code', code);`
     `localStorage.setItem('fermegest_farm_role', 'partner');`
     `localStorage.setItem('fermegest_farm_owner_email', ownerEmail);`
     `localStorage.removeItem('fermegest_pending_push');` // VITAL : éliminer tout push en attente de l'ancien état vide.
   - GESTION DU MODE INVITÉ vs MODE CONNECTÉ :
     * Si `!this.currentUser` (Mode Invité) :
       INTERDICTION ABSOLUE D'ÉCRIRE DANS SUPABASE ! Ne pas appeler `this.client.from('user_farms').upsert(...)`.
       L'invité utilise les données adoptées en mémoire/localStorage et s'abonne au canal Realtime collaboratif.
     * Si `this.currentUser` (Mode Connecté) :
       SEULEMENT APRÈS l'adoption des données du propriétaire, enregistrer la ligne de l'associé dans `user_farms` avec :
       `user_id: this.currentUser.id`, `data: { ...adoptedOwnerData, farmCode: code, farmRole: 'partner', ownerEmail: ownerEmail }`.
       Ainsi, la ligne cloud de l'associé est une copie miroir fidèle de la ferme du propriétaire, JAMAIS du vide !
   - ABONNEMENT REALTIME :
     Appeler `this.subscribeCollaborativeRealtime()`.
   - MISE À JOUR UI & NOTIFICATION :
     Actualiser l'UI et afficher le toast de confirmation ("Connecté à la ferme de [ownerEmail]").

2. `leaveSharedFarm()` :
   - Demander confirmation à l'utilisateur.
   - Repasser `fermegest_farm_role` à 'owner'.
   - Générer un nouveau code de ferme individuel (`this.generateFarmCode()`).
   - Supprimer `fermegest_farm_owner_email`.
   - Se réabonner au canal Realtime individuel.
   - Mettre à jour l'UI.

3. `syncNow(showToast = true)` :
   - Si `!this.client || !this.currentUser` : si invité non connecté, afficher un message d'invitation ou ignorer silencieusement si silent.
   - Si le compte est 'partner' : la ligne du 'owner' dans `user_farms` est la vérité absolue pour le cheptel (`animals`) et les stocks. Le partenaire ne peut JAMAIS écraser les animaux du propriétaire par une liste vide `[]`.
   - Si des modifications locales sont en attente de push (`hasPendingPush`), pousser uniquement si ce n'est pas un écrasement destructif.

4. `pushData(showToast = false, force = false)` :
   - Si `!this.currentUser` : RETURN IMMÉDIAT (zéro écriture non authentifiée).
   - Guardrail souverain : Si le compte est 'partner', et que l'état local a `animals.length === 0` alors que la ferme d'origine avait des animaux, INTERDIRE formellement le push d'animaux vides !

5. `broadcastCurrentState()` :
   - Guardrail souverain : Si le rôle est 'partner' et `animals.length === 0`, ne JAMAIS diffuser un état d'animaux vide sur le canal Realtime.

6. `subscribeCollaborativeRealtime()` :
   - Dans le récepteur `farm_update` :
     Si le message reçu contient `animals: []` alors que le terminal local possède des animaux existants, et que ce n'est PAS un ordre explicite de reset (`_resetCleared === true`), IGNORER la suppression destructive des animaux.

Rédige le code JavaScript complet, propre et prêt à être inséré dans `supabase-client.js`.
"""

    print("Phase 1 : Gemini Pro génère le code...")
    code_gemini = call_gemini(coder_prompt)
    print("Code généré par Gemini Pro.")

    audit_prompt = f"""
Tu es le Lead QA & Auditeur Sécurité Systèmes Critiques (25 ans d'expérience).
Examine scrupuleusement le code suivant produit par l'Architecte Gemini Pro :

{code_gemini}

MISSION D'AUDIT :
Vérifie point par point :
1. ADHÉSION (joinFarmWithCode) :
   - En Mode Invité (`this.currentUser == null`), y a-t-il la moindre tentative d'accès à `this.currentUser.id` ou d'écriture dans `user_farms` ?
   - Les données du propriétaire sont-elles bien lues et adoptées à 100% SANS écraser la ferme du propriétaire ?
   - Si le code est invalide ou inexistant, est-on garanti à 100% que rien n'est modifié ?
   - `fermegest_pending_push` est-il bien neutralisé pour empêcher tout envoi différé d'anciennes données vides ?
2. SYNCHRONISATION (syncNow) :
   - Un compte associé (partner) peut-il effacer les animaux du propriétaire ?
   - Le propriétaire conserve-t-il sa souveraineté absolue sur son cheptel ?
3. SAUVEGARDE & REALTIME (pushData, broadcastCurrentState) :
   - L'état vide d'un invité/associé peut-il contaminer le Cloud ou les autres appareils via WebSockets Realtime ?
4. CONCLUSION & VERDICT :
   - Sois extrêmement précis et exigeant.
   - S'il y a le moindre défaut ou risque d'écrasement ou d'erreur JS, explique-le précisément pour que Gemini le corrige.
   - Si le code est irréprochable et garantit 100% de sécurité, termine par :
     VERDICT: 100% APPROVED
"""

    print("Phase 2 : Groq QA (openai/gpt-oss-120b) audite le code...")
    verdict_groq = call_groq(audit_prompt)
    print("Verdict de Groq QA reçu.")

    iteration = 1
    final_code = code_gemini

    if "VERDICT: 100% APPROVED" not in verdict_groq:
        print("Groq QA a formulé des réserves. Phase 3 : Raffinement par Gemini...")
        refine_prompt = f"""
Voici le rapport d'audit sévère de Groq QA sur ton code :

{verdict_groq}

Corrige immédiatement chaque point soulevé par l'auditeur et fournis la version définitive et parfaite du code JavaScript.
"""
        final_code = call_gemini(refine_prompt)
        print("Gemini Pro a produit le code corrigé.")

        print("Phase 4 : Re-vérification finale par Groq QA...")
        final_audit_prompt = f"""
Voici la version révisée du code par Gemini Pro suite à tes remarques :

{final_code}

Ré-audite cette version finale. Si tous les points critiques sont résolus, conclus par :
VERDICT: 100% APPROVED
"""
        verdict_groq = call_groq(final_audit_prompt)
        print("Verdict final de Groq QA reçu.")

    consensus_data = {
        "final_code": final_code,
        "verdict": verdict_groq,
        "status": "APPROVED" if "VERDICT: 100% APPROVED" in verdict_groq else "REFINED"
    }

    with open("scripts/collaborative_sync_final_consensus.json", "w", encoding="utf-8") as f:
        json.dump(consensus_data, f, indent=2, ensure_ascii=False)

    print(f"Consensus terminé. Status: {consensus_data['status']}")
    print(f"Extrait du verdict :\n{verdict_groq[:1000]}")

if __name__ == "__main__":
    main()
