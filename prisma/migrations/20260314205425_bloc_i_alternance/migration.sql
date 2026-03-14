-- CreateEnum
CREATE TYPE "StatutAlternance" AS ENUM ('EN_COURS', 'TERMINEE', 'ROMPUE', 'ANNULEE');

-- AlterTable
ALTER TABLE "Etudiant" ADD COLUMN     "date_entree_formation" TIMESTAMP(3),
ADD COLUMN     "date_rentree_officielle" TIMESTAMP(3),
ADD COLUMN     "date_sortie_formation" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "HistoriqueAlternance" (
    "id" TEXT NOT NULL,
    "etudiant_id" TEXT NOT NULL,
    "entreprise_id" TEXT,
    "nom_entreprise_libre" TEXT,
    "type_contrat" "TypeContrat",
    "poste" TEXT,
    "date_debut_contrat" TIMESTAMP(3),
    "date_fin_contrat" TIMESTAMP(3),
    "date_rupture" TIMESTAMP(3),
    "motif_rupture" TEXT,
    "statut" "StatutAlternance" NOT NULL DEFAULT 'EN_COURS',
    "commentaire" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoriqueAlternance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoriqueAlternance_etudiant_id_idx" ON "HistoriqueAlternance"("etudiant_id");

-- CreateIndex
CREATE INDEX "HistoriqueAlternance_entreprise_id_idx" ON "HistoriqueAlternance"("entreprise_id");

-- CreateIndex
CREATE INDEX "HistoriqueAlternance_statut_idx" ON "HistoriqueAlternance"("statut");

-- AddForeignKey
ALTER TABLE "HistoriqueAlternance" ADD CONSTRAINT "HistoriqueAlternance_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "Etudiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueAlternance" ADD CONSTRAINT "HistoriqueAlternance_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
