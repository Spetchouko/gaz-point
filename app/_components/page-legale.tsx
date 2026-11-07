import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

type LegalItem = {
  term: string
  value: string
}

type LegalSection = {
  id: string
  title: string
  paragraphs?: string[]
  items?: LegalItem[]
  list?: string[]
  note?: string
  closing?: string[]
}

export type LegalDocument = {
  eyebrow: string
  title: string
  intro: string
  updated: string
  sections: LegalSection[]
}

export function PageLegale({ document }: { document: LegalDocument }) {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {document.eyebrow}
          </p>

          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {document.title}
          </h1>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            {document.intro}
          </p>

          <p className="mt-4 text-xs text-muted-foreground">
            Dernière mise à jour : {document.updated}
          </p>

          <nav
            aria-label="Sommaire"
            className="mt-10 rounded-xl border bg-card p-6"
          >
            <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Sommaire
            </h2>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {document.sections.map((section, index) => (
                <li key={section.id} className="flex gap-2 text-sm">
                  <span className="tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}.
                  </span>
                  <Link
                    href={`#${section.id}`}
                    className="text-pretty text-foreground transition-colors hover:text-primary"
                  >
                    {section.title}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-14 space-y-12">
            {document.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {section.title}
                </h2>

                {section.paragraphs && Array.isArray(section.paragraphs) ? (
                section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))
              ) : section.paragraphs ? (
                <p
                  key="paragraph"
                  className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
                >
                  {section.paragraphs}
                </p>
              ) : null}

                {section.items && (
                  <dl className="mt-6 overflow-hidden rounded-xl border bg-card">
                    {section.items.map((item) => (
                      <div
                        key={item.term}
                        className="flex flex-col gap-1 border-b border-border px-5 py-3 last:border-b-0 sm:flex-row sm:gap-6"
                      >
                        <dt className="text-sm font-medium text-foreground sm:w-52 sm:shrink-0">
                          {item.term}
                        </dt>
                        <dd className="text-pretty text-sm text-muted-foreground">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {section.list && (
                  <ul className="mt-5 space-y-2.5">
                    {section.list.map((item) => (
                      <li key={item} className="flex gap-3">
                        <Check
                          aria-hidden
                          className="mt-1 size-4 shrink-0 text-primary"
                        />
                        <span className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.note && (
                  <p className="mt-5 rounded-lg bg-muted/60 p-4 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {section.note}
                  </p>
                )}

                {section.closing?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <nav
            aria-label="Autres pages"
            className="mt-14 rounded-xl border bg-card p-6"
          >
            <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Documents liés
            </h2>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              <li>
                <Link
                  href="/a-propos"
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  À propos de GazPoints
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  Nous écrire
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </section>
  )
}