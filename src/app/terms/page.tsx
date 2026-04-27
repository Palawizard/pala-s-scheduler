import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/layout/site-footer'

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Pala's Scheduler",
  description: "Conditions d'utilisation de Pala's Scheduler",
}

export default function TermsPage() {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 md:px-6 md:py-14">
        <Link href="/calendar" className="text-muted-foreground hover:text-foreground text-sm">
          Retour à l’application
        </Link>

        <header className="mt-8">
          <p className="text-muted-foreground text-sm">Dernière mise à jour : 27 avril 2026</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Conditions d’utilisation</h1>
          <p className="text-muted-foreground mt-4 text-sm leading-6">
            Les présentes conditions encadrent l’accès et l’utilisation de Pala&apos;s Scheduler,
            une application personnelle de planification, publication et suivi de contenus sur les
            réseaux sociaux.
          </p>
        </header>

        <div className="mt-10 space-y-8 text-sm leading-7">
          <section>
            <h2 className="text-lg font-semibold">1. Objet du service</h2>
            <p className="text-muted-foreground mt-3">
              Pala&apos;s Scheduler permet de préparer des publications, téléverser des médias,
              connecter des comptes sociaux compatibles, programmer des publications et consulter
              des statistiques de performance lorsque les plateformes concernées les rendent
              disponibles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Accès au service</h2>
            <p className="text-muted-foreground mt-3">
              L’accès au service nécessite un compte utilisateur. Vous êtes responsable de la
              confidentialité de vos accès, des actions effectuées depuis votre session et de
              l’exactitude des informations fournies lors de l’utilisation du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Comptes sociaux connectés</h2>
            <p className="text-muted-foreground mt-3">
              Lorsque vous connectez YouTube, Instagram, TikTok ou X, vous autorisez Pala&apos;s
              Scheduler à utiliser les accès nécessaires pour publier du contenu, récupérer des
              informations de compte et synchroniser certaines statistiques. Vous pouvez révoquer
              ces accès depuis les paramètres du service ou depuis l’interface de la plateforme
              concernée.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Contenus publiés</h2>
            <p className="text-muted-foreground mt-3">
              Vous conservez vos droits sur les textes, images, vidéos et autres contenus que vous
              importez ou publiez. Vous garantissez disposer des droits nécessaires pour utiliser
              ces contenus et vous engagez à respecter les lois applicables, les droits des tiers et
              les règles propres à chaque plateforme sociale.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Usages interdits</h2>
            <p className="text-muted-foreground mt-3">
              Il est interdit d’utiliser le service pour publier des contenus illicites, trompeurs,
              haineux, contrefaisants, frauduleux, malveillants ou portant atteinte à la vie privée
              d’autrui. Il est également interdit de tenter de contourner les mesures de sécurité,
              d’extraire abusivement les données du service ou de perturber son fonctionnement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Disponibilité et plateformes tierces</h2>
            <p className="text-muted-foreground mt-3">
              Le service dépend d’infrastructures et d’API tierces, notamment les plateformes
              sociales, l’hébergement, la base de données, la file de tâches et le stockage des
              médias. Des interruptions, limites de quota, changements d’API ou refus de publication
              peuvent survenir sans que Pala&apos;s Scheduler ne puisse les contrôler.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Sécurité</h2>
            <p className="text-muted-foreground mt-3">
              Pala&apos;s Scheduler met en place des mesures raisonnables pour protéger les comptes,
              les médias et les jetons d’accès aux plateformes. Vous devez signaler rapidement toute
              utilisation non autorisée ou tout incident suspect lié à votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Responsabilité</h2>
            <p className="text-muted-foreground mt-3">
              Le service est fourni pour faciliter l’organisation et la publication de contenus. Il
              ne garantit pas l’acceptation, la visibilité, la performance ou le maintien en ligne
              des publications sur les plateformes tierces. Vous restez responsable des contenus
              publiés, des paramètres choisis et du respect des règles applicables.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Suspension ou suppression d’accès</h2>
            <p className="text-muted-foreground mt-3">
              L’accès au service peut être suspendu ou supprimé en cas d’usage abusif, de risque de
              sécurité, de violation des présentes conditions ou de demande légitime d’une
              plateforme ou d’une autorité compétente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Données personnelles</h2>
            <p className="text-muted-foreground mt-3">
              Le traitement des données personnelles est décrit dans la{' '}
              <Link href="/privacy" className="text-foreground underline underline-offset-4">
                politique de confidentialité
              </Link>
              . Elle précise les catégories de données traitées, les finalités, les durées de
              conservation et les droits dont vous disposez.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">11. Modification des conditions</h2>
            <p className="text-muted-foreground mt-3">
              Ces conditions peuvent être modifiées pour tenir compte de l’évolution du service, des
              plateformes connectées ou du cadre légal. La date de mise à jour indique la version en
              vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">12. Contact</h2>
            <p className="text-muted-foreground mt-3">
              Pour toute question concernant ces conditions, vous pouvez écrire à{' '}
              <a
                href="mailto:palawi.pro@gmail.com"
                className="text-foreground underline underline-offset-4"
              >
                palawi.pro@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
