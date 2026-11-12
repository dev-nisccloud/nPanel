import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input.tsx";
import FileField from "@/components/ui/file-field.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { trpcQuery } from "@/lib/domain-search/api.ts";

type Country = { code: string; name: string };

const fieldClass = "min-h-11";

function today() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function CareerApplyForm({ slug, roleTitle }: { slug: string; roleTitle: string }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [heardAbout, setHeardAbout] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [city, setCity] = useState("");
  const [cityChoices, setCityChoices] = useState<string[]>([]);
  const [freeTextCity, setFreeTextCity] = useState(false);
  const [heardFrom, setHeardFrom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      trpcQuery<Country[]>("careers.countries"),
      trpcQuery<string[]>("careers.heardAboutOptions"),
    ])
      .then(([countryRows, options]) => {
        if (cancelled) return;
        setCountries(countryRows);
        setHeardAbout(options);
      })
      .catch(() => {
        if (!cancelled) setError("The application form could not be loaded. Email careers@nisccloud.com.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!countryCode || freeTextCity) return;
    const query = cityQuery.trim();
    if (query.length < 2 || query === city) {
      setCityChoices([]);
      return;
    }
    const handle = window.setTimeout(() => {
      trpcQuery<{ freeText: boolean; cities: string[] }>("careers.cities", { countryCode, query })
        .then((result) => {
          setFreeTextCity(result.freeText);
          setCityChoices(result.cities);
        })
        .catch(() => setCityChoices([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [city, cityQuery, countryCode, freeTextCity]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    form.set("slug", slug);
    form.set("countryCode", countryCode);
    const chosenCity = (freeTextCity ? cityQuery : city || cityQuery).trim();
    form.set("city", chosenCity);
    form.set("heardFrom", heardFrom);
    if (!countryCode || !chosenCity) {
      setError("Choose a country and a city.");
      return;
    }
    const cv = form.get("cv");
    if (!(cv instanceof File) || cv.size === 0) {
      setError("Choose a CV. If the file is wrong, remove it and choose another.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/careers/apply", { method: "POST", body: form });
      const body = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
      if (!response.ok || !body?.ok) {
        setError(body?.error ?? "The application could not be sent.");
        return;
      }
      setDone(true);
    } catch {
      setError("The application could not be sent. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-2xl border border-border bg-card p-5 text-sm text-foreground">
        Your application for {roleTitle} has been received. We will use the email address you entered if we need to reply.
      </p>
    );
  }

  return (
    <form className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:p-6" onSubmit={onSubmit}>
      <h2 className="text-xl font-semibold text-foreground">Apply for {roleTitle}</h2>
      <input className="hidden" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="career-name">Full name</Label>
          <Input id="career-name" name="fullName" className={fieldClass} autoComplete="name" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="career-email">Email</Label>
          <Input id="career-email" name="email" type="email" className={fieldClass} autoComplete="email" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="career-phone">Phone number</Label>
          <Input
            id="career-phone"
            name="phone"
            type="tel"
            className={fieldClass}
            autoComplete="tel"
            placeholder="+254 7XX XXX XXX"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="career-start">What date can you join us?</Label>
          <Input id="career-start" name="availableFrom" type="date" className={fieldClass} min={today()} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="career-country">Country</Label>
          <select
            id="career-country"
            className="border-input min-h-11 rounded-md border bg-transparent px-3 text-sm"
            value={countryCode}
            required
            onChange={(event) => {
              setCountryCode(event.target.value);
              setCity("");
              setCityQuery("");
              setCityChoices([]);
              setFreeTextCity(false);
            }}
          >
            <option value="">Choose a country</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="career-city">Location (city)</Label>
          <Input
            id="career-city"
            className={fieldClass}
            value={freeTextCity ? cityQuery : city || cityQuery}
            disabled={!countryCode}
            placeholder={countryCode ? "Start typing a city" : "Choose a country first"}
            onChange={(event) => {
              const next = event.target.value;
              setCityQuery(next);
              if (freeTextCity) setCity(next);
              else if (next !== city) setCity("");
            }}
            required
          />
          {cityChoices.length > 0 ? (
            <ul className="max-h-40 overflow-auto rounded-md border border-border bg-background">
              {cityChoices.map((choice) => (
                <li key={choice}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setCity(choice);
                      setCityQuery(choice);
                      setCityChoices([]);
                    }}
                  >
                    {choice}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="career-heard">How did you hear about this job?</Label>
          <select
            id="career-heard"
            className="border-input min-h-11 rounded-md border bg-transparent px-3 text-sm"
            value={heardFrom}
            required
            onChange={(event) => setHeardFrom(event.target.value)}
          >
            <option value="">Choose one</option>
            {heardAbout.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {heardFrom === "Other" ? (
          <div className="grid gap-2">
            <Label htmlFor="career-heard-other">Tell us where</Label>
            <Input id="career-heard-other" name="heardOther" className={fieldClass} />
          </div>
        ) : null}
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="career-linkedin">LinkedIn profile</Label>
          <Input
            id="career-linkedin"
            name="linkedinUrl"
            type="url"
            className={fieldClass}
            placeholder="https://www.linkedin.com/in/your-name"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="career-salary">What is your desired salary range?</Label>
          <Input
            id="career-salary"
            name="salaryRange"
            className={fieldClass}
            placeholder="For example, KES 80,000–120,000 a month"
            required
          />
        </div>
      </div>
      <FileField
        id="career-cv"
        name="cv"
        label="Resume / CV"
        accept=".pdf,.docx,application/pdf"
        required
        hint="PDF or DOCX, up to 5 MB. Remove the file if you chose the wrong one."
      />
      <div className="grid gap-2">
        <Label htmlFor="career-notes">Is there anything else you'd like us to know about you?</Label>
        <Textarea id="career-notes" name="notes" rows={4} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="submit"
        className="inline-flex min-h-11 w-fit items-center rounded-[10px] bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        disabled={sending}
      >
        {sending ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}
