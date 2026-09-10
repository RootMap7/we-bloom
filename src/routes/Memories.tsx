import { Achievements } from '@/components/memories/Achievements'
import { OnThisDay } from '@/components/memories/OnThisDay'
import { WordCloud } from '@/components/memories/WordCloud'
import { SectionHeading } from '@/components/ui/Card'

/**
 * The nostalgic corner: what was said on this date, the words the chat is built
 * from, and the badges those numbers earn.
 */
export function Memories() {
  return (
    <div className="space-y-14">
      <SectionHeading
        eyebrow="Memories"
        title="The bits worth going back for"
        blurb="Throwbacks, the words you lean on, and what the numbers add up to."
      />

      <section>
        <SectionHeading
          eyebrow="On this day"
          title="What you were saying this time round"
          blurb="Messages from today's date in an earlier year, pulled straight from the export."
        />
        <OnThisDay />
      </section>

      <section>
        <SectionHeading
          eyebrow="Word cloud"
          title="The words this chat is made of"
          blurb="Common words are filtered out, so what's left is the vocabulary that belongs to you two."
        />
        <WordCloud />
      </section>

      <section>
        <SectionHeading
          eyebrow="Achievements"
          title="Badges the numbers earned"
          blurb="Awarded from measurable habits — the hours you keep, how fast you reply, how much you send at once. Nothing here is a judgement about the relationship."
        />
        <Achievements />
      </section>
    </div>
  )
}
