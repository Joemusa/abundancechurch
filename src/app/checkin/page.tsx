"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type ServiceRecord = { id: string; name: string };
type SearchResult = { id: string; member_id: string; first_name: string; surname: string; branch: string };

function CheckinContent() {
  const searchParams = useSearchParams();
  const prefilledBranch = searchParams.get("branch") ?? "";
  const prefilledService = searchParams.get("service") ?? "";

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [step, setStep] = useState<"service" | "search" | "new-visitor" | "success">(
    prefilledService ? "search" : "service"
  );
  const [service, setService] = useState(prefilledService);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [successStatus, setSuccessStatus] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [studyField, setStudyField] = useState("");
  const [schoolGrade, setSchoolGrade] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch services from database so leaders can manage them without redeploying
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .catch(() => setServices([
        { id: "1", name: "Sunday Morning" },
        { id: "2", name: "Sunday Evening" },
        { id: "3", name: "Wednesday Bible Study" },
      ]));
  }, []);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/checkin/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setSearching(false);
  }

  async function handleSelect(member: SearchResult) {
    setError(null);
    const res = await fetch("/api/checkin/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: member.member_id,
        name: `${member.first_name} ${member.surname}`,
        service,
      }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); return; }
    setSuccessName(`${member.first_name} ${member.surname}`);
    setSuccessStatus(data.status);
    setStep("success");
  }

  async function handleNewVisitor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/checkin/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName, surname, cellphone, service,
        gender, age, branch: prefilledBranch,
        employment_status: employmentStatus,
        job_title: jobTitle,
        study_field: studyField,
        school_grade: schoolGrade,
        address,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { setError(data.error); return; }
    setSuccessName(`${firstName} ${surname}`);
    setSuccessStatus(data.status);
    setStep("success");
  }

  function reset() {
    setStep(prefilledService ? "search" : "service");
    setService(prefilledService);
    setQuery(""); setResults([]);
    setFirstName(""); setSurname(""); setCellphone("");
    setGender(""); setAge(""); setEmploymentStatus("");
    setJobTitle(""); setStudyField(""); setSchoolGrade("");
    setAddress(""); setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

        {/* Logo */}
        <div className="bg-teal-800 rounded-lg p-3 mb-5">
          <img src="/logo.png" alt="Abundance City Church" className="w-full max-h-10 object-contain" />
        </div>

        {prefilledBranch && (
          <p className="text-xs text-center text-teal-700 font-medium mb-4 bg-teal-50 rounded-md py-1.5">
            {prefilledBranch}
          </p>
        )}

        <h1 className="text-lg font-medium text-gray-900 mb-1 text-center">Welcome!</h1>
        <p className="text-sm text-gray-500 mb-5 text-center">Check yourself in</p>

        {/* Step 1 — pick a service (skipped if prefilled via QR) */}
        {step === "service" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">Which service are you attending?</p>
            {services.map((s) => (
              <button key={s.id} onClick={() => { setService(s.name); setStep("search"); }}
                className="w-full border border-gray-300 rounded-md py-3 text-sm font-medium hover:bg-gray-50">
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — service selected via QR but no service prefilled, pick service */}
        {step === "search" && !service && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">Which service are you attending?</p>
            {services.map((s) => (
              <button key={s.id} onClick={() => setService(s.name)}
                className="w-full border border-gray-300 rounded-md py-3 text-sm font-medium hover:bg-gray-50">
                {s.name}
              </button>
            ))}
          </div>
        )}

        {step === "search" && service && (
          <div>
            <p className="text-xs text-teal-700 font-medium mb-3 bg-teal-50 rounded-md px-2 py-1 text-center">
              {service}
            </p>
            <input autoFocus placeholder="Type your name..."
              value={query} onChange={(e) => handleSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3" />
            {searching && <p className="text-xs text-gray-400 mb-2">Searching...</p>}
            <div className="space-y-2 mb-4">
              {results.map((m) => (
                <button key={m.id} onClick={() => handleSelect(m)}
                  className="w-full text-left border border-gray-200 rounded-md px-3 py-2 text-sm hover:bg-gray-50">
                  <span className="font-medium">{m.first_name} {m.surname}</span>
                  {m.branch && <span className="text-gray-400 text-xs ml-2">· {m.branch}</span>}
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button onClick={() => setStep("new-visitor")}
              className="w-full text-sm text-teal-700 underline">
              I&apos;m a first-time visitor
            </button>
            {!prefilledService && (
              <button onClick={() => { setStep("service"); setService(""); setQuery(""); setResults([]); }}
                className="w-full text-sm text-gray-400 mt-2 underline">
                ← Change service
              </button>
            )}
          </div>
        )}

        {step === "new-visitor" && (
          <form onSubmit={handleNewVisitor} className="space-y-3">
            <p className="text-xs text-teal-700 font-medium bg-teal-50 rounded-md px-2 py-1 text-center mb-1">
              {service} · Welcome for the first time! 🎉
            </p>
            <p className="text-xs text-gray-400 text-center mb-2">
              Please fill in your details so we can keep in touch.
            </p>

            {/* Name */}
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="First name *" required value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
              <input placeholder="Surname *" required value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>

            {/* Cellphone */}
            <input placeholder="Cellphone *" required value={cellphone}
              onChange={(e) => setCellphone(e.target.value)}
              type="tel"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />

            {/* Gender */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Gender</p>
              <div className="grid grid-cols-2 gap-2">
                {["Male", "Female"].map((g) => (
                  <button key={g} type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 text-sm rounded-md border transition-colors ${
                      gender === g
                        ? "bg-teal-600 text-white border-teal-600"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Age group */}
            <select value={age} onChange={(e) => setAge(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Age group (optional)</option>
              {["Under 18", "18-25", "26-35", "36-45", "46-55", "56-65", "66+"].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Employment */}
            <select value={employmentStatus}
              onChange={(e) => { setEmploymentStatus(e.target.value); setJobTitle(""); setStudyField(""); setSchoolGrade(""); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Employment status (optional)</option>
              {["Employed", "Self-employed", "Unemployed", "Student", "Scholar", "Retired"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Conditional field based on employment */}
            {(employmentStatus === "Employed" || employmentStatus === "Self-employed") && (
              <input
                placeholder="Type of job / job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            )}
            {employmentStatus === "Student" && (
              <input
                placeholder="Degree / Diploma / Certificate & field of study"
                value={studyField}
                onChange={(e) => setStudyField(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            )}
            {employmentStatus === "Scholar" && (
              <input
                placeholder="Grade (e.g. Grade 11)"
                value={schoolGrade}
                onChange={(e) => setSchoolGrade(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            )}

            {/* Address */}
            <textarea placeholder="Home address (optional)" value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={saving}
              className="w-full bg-teal-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-teal-800 disabled:opacity-50">
              {saving ? "Checking in..." : "Check in"}
            </button>
            <button type="button" onClick={() => setStep("search")}
              className="w-full text-sm text-gray-400">← Back</button>
          </form>
        )}

        {step === "success" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xl font-medium text-gray-900 mb-1">Welcome, {successName}!</p>
            <p className="text-sm text-gray-500 mb-1">{service}</p>
            {prefilledBranch && <p className="text-xs text-teal-700 mb-4">{prefilledBranch}</p>}
            {successStatus === "First Visit" && (
              <p className="text-sm text-teal-700 font-medium mb-4">
                🎉 Welcome for the first time!
              </p>
            )}
            {successStatus === "Second Visit" && (
              <p className="text-sm text-teal-700 font-medium mb-4">
                Great to see you again!
              </p>
            )}
            <button onClick={reset}
              className="text-sm text-teal-700 underline">
              Done (next person)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense>
      <CheckinContent />
    </Suspense>
  );
}
