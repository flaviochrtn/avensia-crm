-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DIRECTION', 'COMMERCIAL', 'ADMINISTRATIF');

-- CreateEnum
CREATE TYPE "EtapeEtudiant" AS ENUM ('NOUVEAU', 'CONTACTE', 'RDV0_PLANIFIE', 'RDV0_FAIT', 'RDV1_PLANIFIE', 'RDV1_FAIT', 'RDV2_PLANIFIE', 'RDV2_FAIT', 'DOSSIER_EN_COURS', 'INSCRIT');

-- CreateEnum
CREATE TYPE "StatutEtudiant" AS ENUM ('EN_COURS', 'INSCRIT_EN_RECHERCHE', 'INSCRIT_ALTERNANCE', 'ABANDON', 'NON_RETENU', 'INVALIDE');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('APPRENTISSAGE', 'PROFESSIONNALISATION');

-- CreateEnum
CREATE TYPE "OrigineContact" AS ENUM ('SALON_ETUDIANT', 'BOUCHE_A_OREILLE', 'JPO', 'INSTAGRAM', 'GOOGLE', 'LINKEDIN', 'PARTENAIRE', 'AUTRE');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('M', 'F', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutEntreprise" AS ENUM ('NOUVEAU', 'A_CONTACTER', 'CONTACTE', 'QUALIFIE', 'BESOIN_OUVERT', 'RDV_PLANIFIE', 'PARTENAIRE_ACTIF', 'AUCUN_BESOIN', 'PERDU');

-- CreateEnum
CREATE TYPE "StatutOffre" AS ENUM ('OUVERTE', 'POURVUE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('A_ENVOYER', 'ENVOYEE', 'EN_ATTENTE', 'ENTRETIEN_PLANIFIE', 'ENTRETIEN_FAIT', 'ACCEPTEE', 'REFUSEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypeRDV" AS ENUM ('APPEL', 'ENTRETIEN_ADMISSION', 'TEST_POSITIONNEMENT', 'RDV_PHYSIQUE', 'ENTRETIEN_ENTREPRISE', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutRDV" AS ENUM ('PLANIFIE', 'FAIT', 'ANNULE', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "TypeTache" AS ENUM ('RELANCE_TELEPHONE', 'RELANCE_EMAIL', 'ENVOI_CV', 'PREPARATION_RDV', 'SUIVI_DOSSIER', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutTache" AS ENUM ('A_FAIRE', 'EN_COURS', 'FAIT', 'ANNULE');

-- CreateEnum
CREATE TYPE "Priorite" AS ENUM ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('CV', 'LETTRE_MOTIVATION', 'BULLETINS_SCOLAIRES', 'DIPLOMES', 'RELEVES_NOTES', 'PHOTO_IDENTITE', 'CARTE_IDENTITE', 'ATTESTATION_SS', 'CARTE_SEJOUR', 'CONTRAT_ALTERNANCE_PRECEDENT', 'JUSTIFICATIF_HANDICAP', 'CERFA', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutDocument" AS ENUM ('RECU', 'MANQUANT', 'NON_APPLICABLE', 'EXPIRE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COMMERCIAL',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "duree_mois" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etudiant" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "date_naissance" TIMESTAMP(3),
    "sexe" "Sexe",
    "adresse" TEXT,
    "ville" TEXT,
    "permis" BOOLEAN,
    "vehicule" BOOLEAN,
    "situation_handicap" BOOLEAN,
    "formation_id" TEXT,
    "type_contrat" "TypeContrat",
    "diplome_actuel" TEXT,
    "formation_actuelle" TEXT,
    "specialisation" TEXT,
    "etape_process" "EtapeEtudiant" NOT NULL DEFAULT 'NOUVEAU',
    "statut" "StatutEtudiant" NOT NULL DEFAULT 'EN_COURS',
    "niveau_motivation" INTEGER,
    "niveau_test" TEXT,
    "niveau_cours" TEXT,
    "origine_contact" "OrigineContact",
    "statut_motivation" TEXT,
    "campagne" TEXT,
    "apporteur_nom" TEXT,
    "conseiller_id" TEXT,
    "entreprise_liee_id" TEXT,
    "date_premier_contact" TIMESTAMP(3),
    "date_prochaine_relance" TIMESTAMP(3),
    "note_prochaine_relance" TEXT,
    "pack_suivi_alternance" TEXT,
    "cv_url" TEXT,
    "commentaire" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Etudiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entreprise" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "secteur" TEXT,
    "type_structure" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "telephone" TEXT,
    "email_general" TEXT,
    "site_web" TEXT,
    "linkedin" TEXT,
    "statut" "StatutEntreprise" NOT NULL DEFAULT 'NOUVEAU',
    "besoin_alternant" BOOLEAN,
    "nombre_postes" INTEGER NOT NULL DEFAULT 0,
    "formations_recherchees" TEXT,
    "profil_recherche" TEXT,
    "numero_idcc" TEXT,
    "campagne" TEXT,
    "date_premier_contact" TIMESTAMP(3),
    "date_prochaine_relance" TIMESTAMP(3),
    "responsable_id" TEXT,
    "commentaire" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactEntreprise" (
    "id" TEXT NOT NULL,
    "nom_complet" TEXT NOT NULL,
    "prenom" TEXT,
    "poste" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "decideur" BOOLEAN NOT NULL DEFAULT false,
    "entreprise_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEntreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offre" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type_contrat" "TypeContrat",
    "nombre_postes" INTEGER NOT NULL DEFAULT 1,
    "statut" "StatutOffre" NOT NULL DEFAULT 'OUVERTE',
    "date_debut" TIMESTAMP(3),
    "formation_ciblee" TEXT,
    "entreprise_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidature" (
    "id" TEXT NOT NULL,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'A_ENVOYER',
    "date_envoi" TIMESTAMP(3),
    "canal_envoi" TEXT,
    "date_retour" TIMESTAMP(3),
    "commentaire" TEXT,
    "etudiant_id" TEXT NOT NULL,
    "entreprise_id" TEXT NOT NULL,
    "offre_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendezVous" (
    "id" TEXT NOT NULL,
    "type" "TypeRDV" NOT NULL,
    "date" TIMESTAMP(3),
    "duree_minutes" INTEGER,
    "statut" "StatutRDV" NOT NULL DEFAULT 'PLANIFIE',
    "notes" TEXT,
    "numero_rdv" INTEGER,
    "etudiant_id" TEXT,
    "entreprise_id" TEXT,
    "animateur_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RendezVous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tache" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "TypeTache" NOT NULL,
    "priorite" "Priorite" NOT NULL DEFAULT 'NORMALE',
    "statut" "StatutTache" NOT NULL DEFAULT 'A_FAIRE',
    "date_echeance" TIMESTAMP(3),
    "date_completion" TIMESTAMP(3),
    "commentaire" TEXT,
    "assigne_id" TEXT,
    "etudiant_id" TEXT,
    "entreprise_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL,
    "statut" "StatutDocument" NOT NULL DEFAULT 'MANQUANT',
    "nom_fichier" TEXT,
    "url" TEXT,
    "commentaire" TEXT,
    "etudiant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "auteur_id" TEXT,
    "etudiant_id" TEXT,
    "entreprise_id" TEXT,
    "candidature_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "champ" TEXT,
    "ancienne_valeur" TEXT,
    "nouvelle_valeur" TEXT,
    "auteur_id" TEXT,
    "auteur_nom" TEXT,
    "etudiant_id" TEXT,
    "entreprise_id" TEXT,
    "candidature_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Formation_code_key" ON "Formation"("code");

-- CreateIndex
CREATE INDEX "Etudiant_statut_idx" ON "Etudiant"("statut");

-- CreateIndex
CREATE INDEX "Etudiant_etape_process_idx" ON "Etudiant"("etape_process");

-- CreateIndex
CREATE INDEX "Etudiant_conseiller_id_idx" ON "Etudiant"("conseiller_id");

-- CreateIndex
CREATE INDEX "Etudiant_formation_id_idx" ON "Etudiant"("formation_id");

-- CreateIndex
CREATE INDEX "Entreprise_nom_idx" ON "Entreprise"("nom");

-- CreateIndex
CREATE INDEX "Entreprise_ville_idx" ON "Entreprise"("ville");

-- CreateIndex
CREATE INDEX "Entreprise_statut_idx" ON "Entreprise"("statut");

-- CreateIndex
CREATE INDEX "Entreprise_responsable_id_idx" ON "Entreprise"("responsable_id");

-- CreateIndex
CREATE INDEX "ContactEntreprise_entreprise_id_idx" ON "ContactEntreprise"("entreprise_id");

-- CreateIndex
CREATE INDEX "Offre_entreprise_id_idx" ON "Offre"("entreprise_id");

-- CreateIndex
CREATE INDEX "Offre_statut_idx" ON "Offre"("statut");

-- CreateIndex
CREATE INDEX "Candidature_etudiant_id_idx" ON "Candidature"("etudiant_id");

-- CreateIndex
CREATE INDEX "Candidature_entreprise_id_idx" ON "Candidature"("entreprise_id");

-- CreateIndex
CREATE INDEX "Candidature_offre_id_idx" ON "Candidature"("offre_id");

-- CreateIndex
CREATE INDEX "Candidature_statut_idx" ON "Candidature"("statut");

-- CreateIndex
CREATE INDEX "RendezVous_etudiant_id_idx" ON "RendezVous"("etudiant_id");

-- CreateIndex
CREATE INDEX "RendezVous_entreprise_id_idx" ON "RendezVous"("entreprise_id");

-- CreateIndex
CREATE INDEX "RendezVous_date_idx" ON "RendezVous"("date");

-- CreateIndex
CREATE INDEX "RendezVous_statut_idx" ON "RendezVous"("statut");

-- CreateIndex
CREATE INDEX "Tache_assigne_id_idx" ON "Tache"("assigne_id");

-- CreateIndex
CREATE INDEX "Tache_statut_idx" ON "Tache"("statut");

-- CreateIndex
CREATE INDEX "Tache_date_echeance_idx" ON "Tache"("date_echeance");

-- CreateIndex
CREATE INDEX "Tache_etudiant_id_idx" ON "Tache"("etudiant_id");

-- CreateIndex
CREATE INDEX "Tache_entreprise_id_idx" ON "Tache"("entreprise_id");

-- CreateIndex
CREATE INDEX "Document_etudiant_id_idx" ON "Document"("etudiant_id");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_statut_idx" ON "Document"("statut");

-- CreateIndex
CREATE INDEX "Note_etudiant_id_idx" ON "Note"("etudiant_id");

-- CreateIndex
CREATE INDEX "Note_entreprise_id_idx" ON "Note"("entreprise_id");

-- CreateIndex
CREATE INDEX "Note_candidature_id_idx" ON "Note"("candidature_id");

-- CreateIndex
CREATE INDEX "Note_created_at_idx" ON "Note"("created_at");

-- CreateIndex
CREATE INDEX "ActivityLog_etudiant_id_idx" ON "ActivityLog"("etudiant_id");

-- CreateIndex
CREATE INDEX "ActivityLog_entreprise_id_idx" ON "ActivityLog"("entreprise_id");

-- CreateIndex
CREATE INDEX "ActivityLog_candidature_id_idx" ON "ActivityLog"("candidature_id");

-- CreateIndex
CREATE INDEX "ActivityLog_created_at_idx" ON "ActivityLog"("created_at");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etudiant" ADD CONSTRAINT "Etudiant_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "Formation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etudiant" ADD CONSTRAINT "Etudiant_conseiller_id_fkey" FOREIGN KEY ("conseiller_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etudiant" ADD CONSTRAINT "Etudiant_entreprise_liee_id_fkey" FOREIGN KEY ("entreprise_liee_id") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entreprise" ADD CONSTRAINT "Entreprise_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactEntreprise" ADD CONSTRAINT "ContactEntreprise_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offre" ADD CONSTRAINT "Offre_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "Etudiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_offre_id_fkey" FOREIGN KEY ("offre_id") REFERENCES "Offre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "Etudiant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_animateur_id_fkey" FOREIGN KEY ("animateur_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_assigne_id_fkey" FOREIGN KEY ("assigne_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "Etudiant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "Etudiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "Etudiant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_candidature_id_fkey" FOREIGN KEY ("candidature_id") REFERENCES "Candidature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "Etudiant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_candidature_id_fkey" FOREIGN KEY ("candidature_id") REFERENCES "Candidature"("id") ON DELETE SET NULL ON UPDATE CASCADE;
