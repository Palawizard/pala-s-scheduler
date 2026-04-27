import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/layout/site-footer'

export const metadata: Metadata = {
  title: "Politique de confidentialité | Pala's Scheduler",
  description: "Politique de confidentialité de Pala's Scheduler",
}

export default function PrivacyPage() {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 md:px-6 md:py-14">
        <Link href="/calendar" className="text-muted-foreground hover:text-foreground text-sm">
          Retour à l’application
        </Link>

        <header className="mt-8">
          <p className="text-muted-foreground text-sm">Dernière mise à jour : 27 avril 2026</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Politique de confidentialité
          </h1>
          <p className="text-muted-foreground mt-4 text-sm leading-6">
            Cette politique explique comment Pala&apos;s Scheduler traite les données personnelles
            nécessaires à la planification, la publication et l’analyse de contenus sur les réseaux
            sociaux.
          </p>
        </header>

        <div className="mt-10 space-y-8 text-sm leading-7">
          <section>
            <h2 className="text-lg font-semibold">1. Responsable du traitement</h2>
            <p className="text-muted-foreground mt-3">
              Le responsable du traitement est l’éditeur de Pala&apos;s Scheduler. Pour toute
              question relative aux données personnelles, vous pouvez écrire à{' '}
              <a
                href="mailto:palawi.pro@gmail.com"
                className="text-foreground underline underline-offset-4"
              >
                palawi.pro@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Données traitées</h2>
            <p className="text-muted-foreground mt-3">
              Selon votre utilisation du service, les données suivantes peuvent être traitées :
              identité de compte, adresse e-mail, image de profil, session de connexion, comptes
              sociaux connectés, identifiants publics des plateformes, jetons d’accès, contenus de
              publication, médias importés, dates de planification, statuts de publication,
              statistiques agrégées et journaux techniques nécessaires au fonctionnement du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Finalités</h2>
            <p className="text-muted-foreground mt-3">
              Ces données sont utilisées pour authentifier les utilisateurs, maintenir la session,
              connecter les plateformes sociales, préparer et publier les contenus demandés, stocker
              les médias, programmer les tâches de publication, synchroniser les statistiques,
              sécuriser le service et diagnostiquer les erreurs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Bases légales</h2>
            <p className="text-muted-foreground mt-3">
              Les traitements nécessaires au fonctionnement du service reposent principalement sur
              l’exécution du contrat ou des mesures précontractuelles. Les traitements liés à la
              sécurité, à la prévention des abus et à l’amélioration technique reposent sur
              l’intérêt légitime de l’éditeur. Lorsque la loi l’exige, certains traitements peuvent
              reposer sur votre consentement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Plateformes tierces</h2>
            <p className="text-muted-foreground mt-3">
              Lorsque vous connectez une plateforme sociale, Pala&apos;s Scheduler échange des
              données avec cette plateforme pour obtenir l’autorisation d’accès, publier vos
              contenus et récupérer les informations nécessaires au suivi. Chaque plateforme reste
              responsable de ses propres traitements selon ses conditions et sa politique de
              confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Conservation</h2>
            <p className="text-muted-foreground mt-3">
              Les données de compte sont conservées tant que votre compte est actif. Les contenus,
              médias, planifications et statistiques sont conservés tant qu’ils sont utiles à votre
              usage du service, sauf suppression de votre part ou obligation de conservation plus
              longue. Les jetons d’accès sont conservés tant que le compte social reste connecté.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Destinataires et sous-traitants</h2>
            <p className="text-muted-foreground mt-3">
              Les données peuvent être traitées par les services nécessaires au fonctionnement de
              Pala&apos;s Scheduler : hébergement applicatif, base de données, file de tâches,
              stockage des médias, messagerie d’authentification et API des plateformes sociales.
              Les accès sont limités à ce qui est nécessaire au fonctionnement du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Sécurité</h2>
            <p className="text-muted-foreground mt-3">
              Des mesures techniques et organisationnelles raisonnables sont mises en place pour
              protéger les données, notamment la protection des sessions, le contrôle d’accès par
              utilisateur, le stockage sécurisé des secrets et la limitation des données retournées
              par les API. Aucun système ne peut toutefois garantir une sécurité absolue.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Cookies et traceurs</h2>
            <p className="text-muted-foreground mt-3">
              Le service peut utiliser des cookies ou technologies similaires nécessaires à
              l’authentification, au maintien de session et à la sécurité. Si des traceurs non
              strictement nécessaires sont ajoutés ultérieurement, une information dédiée et, le cas
              échéant, un mécanisme de consentement seront mis en place.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Vos droits</h2>
            <p className="text-muted-foreground mt-3">
              Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la
              portabilité de vos données, ainsi que vous opposer à certains traitements lorsque la
              réglementation le prévoit. Vous pouvez également retirer les autorisations accordées
              aux plateformes sociales depuis les paramètres du service ou depuis les plateformes
              concernées.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">11. Exercer vos droits</h2>
            <p className="text-muted-foreground mt-3">
              Pour exercer vos droits, écrivez à{' '}
              <a
                href="mailto:palawi.pro@gmail.com"
                className="text-foreground underline underline-offset-4"
              >
                palawi.pro@gmail.com
              </a>
              . Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
              réclamation auprès de l’autorité de protection des données compétente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">12. Mise à jour</h2>
            <p className="text-muted-foreground mt-3">
              Cette politique peut être mise à jour pour refléter les évolutions du service, des
              plateformes connectées, des prestataires ou du cadre légal. La date affichée en haut
              de page correspond à la version en vigueur.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
