import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { ContentPage } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <ContentPage eyebrow="Personal assistance" title="Speak with the atelier." intro="For fragrance guidance, order enquiries or a thoughtful recommendation, write to us. We reply within two business days.">
      <div className="grid gap-14 lg:grid-cols-[.7fr_1.3fr]">
        <aside className="space-y-8">
          <div className="flex gap-4"><Mail className="mt-0.5 text-bronze" aria-hidden="true" size={18} /><div><h2 className="eyebrow">Email</h2><a className="mt-2 block text-sm" href="mailto:concierge@priveatelier.example">concierge@priveatelier.example</a></div></div>
          <div className="flex gap-4"><MapPin className="mt-0.5 text-bronze" aria-hidden="true" size={18} /><div><h2 className="eyebrow">Atelier hours</h2><p className="mt-2 text-sm leading-6 text-ink/65">Monday—Friday<br />10:00—18:00 EST</p></div></div>
        </aside>
        <form className="grid gap-6 sm:grid-cols-2" action="#" method="post">
          <Field label="Name" name="name" autoComplete="name" />
          <Field label="Email" name="email" type="email" autoComplete="email" />
          <div className="sm:col-span-2">
            <label className="eyebrow" htmlFor="subject">Subject</label>
            <select className="mt-2 w-full border-b border-ink/25 bg-transparent py-3 text-sm outline-none" id="subject" name="subject">
              <option>Fragrance guidance</option><option>Order enquiry</option><option>Press and partnerships</option><option>Something else</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="eyebrow" htmlFor="message">Message</label>
            <textarea className="mt-2 min-h-36 w-full resize-y border-b border-ink/25 bg-transparent py-3 text-sm outline-none" id="message" name="message" required />
          </div>
          <button className="button-primary h-13 sm:col-span-2 sm:w-max" type="submit">Send enquiry</button>
        </form>
      </div>
    </ContentPage>
  );
}

function Field({ label, name, type = "text", autoComplete }: { label: string; name: string; type?: string; autoComplete?: string }) {
  return <div><label className="eyebrow" htmlFor={name}>{label}</label><input className="mt-2 w-full border-b border-ink/25 bg-transparent py-3 text-sm outline-none" id={name} name={name} type={type} autoComplete={autoComplete} required /></div>;
}
