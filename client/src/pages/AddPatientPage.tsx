import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bed,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  Contact,
  FileText,
  HeartPulse,
  Info,
  Printer,
  Search,
  ShieldCheck,
  Stethoscope,
  Sun,
  User,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import { api } from "../services/api";

const departments = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "Emergency",
  "ENT",
  "Dermatology",
];

const doctors = [
  "Dr. Meera Sharma",
  "Dr. Arjun Patel",
  "Dr. Kavya Rao",
  "Dr. Sameer Khan",
];

const bloodGroups = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type DeskMode = "registration" | "appointment";
type AppointmentVisitType = "OPD" | "IPD" | "Remote";
type SlotStatus = "available" | "limited" | "full";

const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);
const limitedDates = new Set([5, 10, 15, 25, 30]);
const fullSlots = new Set(["11:00 AM", "03:00 PM", "05:00 PM"]);
const appointmentSlots: { period: string; icon: React.ReactNode; slots: string[] }[] = [
  { period: "Morning", icon: <Sun className="h-4 w-4" />, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"] },
  { period: "Afternoon", icon: <Sun className="h-4 w-4" />, slots: ["12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"] },
  { period: "Evening", icon: <CalendarDays className="h-4 w-4" />, slots: ["04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"] }
];

export const AddPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("Male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobile, setMobile] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [department, setDepartment] = useState("General Medicine");
  const [doctor, setDoctor] = useState("");
  const [visitType, setVisitType] = useState<"OPD" | "IPD">("OPD");
  const [deskMode, setDeskMode] = useState<DeskMode>("registration");
  const [reason, setReason] = useState("");
  const [abhaNumber, setAbhaNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [emergencyMode, setEmergencyMode] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const fullName = useMemo(
    () => [firstName.trim(), lastName.trim()].filter(Boolean).join(" "),
    [firstName, lastName]
  );

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  const stopCamera = () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  };

  const handleStartCamera = async () => {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCapturedPhoto(null);
      setCameraStream(stream);
    } catch (err: any) {
      const permissionDenied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      setCameraError(
        permissionDenied
          ? "Camera permission was blocked. Allow camera access from the browser prompt to take a patient photo."
          : "Unable to start the camera. Please check that a camera is connected and available."
      );
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const address = [streetAddress, city, stateName, pincode]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", ");

      const res = await api.post("/patients", {
        name: fullName,
        gender,
        mobile,
        email: email || undefined,
        age: age ? Number(age) : undefined,
        bloodGroup: bloodGroup || undefined,
        address: address || undefined,
        priority: emergencyMode ? "EMERGENCY" : priority,
        department,
        registrationType: visitType,
        emergencyContact: emergencyContact || undefined,
        reasonForVisit: reason || undefined,
        allergies: allergies || undefined,
        abhaNumber: abhaNumber || undefined,
        aadhaarNumber: aadhaarNumber || undefined,
        dateOfBirth: dateOfBirth || undefined,
        consultingDoctor: doctor || undefined,
      });

      if (res.data?.success) {
        setSuccessMsg(`Patient profile "${fullName}" created and added to queue.`);
        setTimeout(() => navigate("/patient-queue"), 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to create new patient record");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-5 py-6 md:px-8">
      <div className="mx-auto max-w-[1580px] space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Front Desk & Registration
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage patient intake, generate digital IDs, and schedule appointments.
            </p>
          </div>

          <div className="inline-grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setDeskMode("registration")}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-black ${
                deskMode === "registration" ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              New Registration
            </button>
            <button
              type="button"
              onClick={() => setDeskMode("appointment")}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-black ${
                deskMode === "appointment" ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Book Appointment
            </button>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            {successMsg}
          </div>
        )}

        {deskMode === "appointment" ? (
          <BookAppointmentWorkspace />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]"
          >
          <aside className="space-y-5 border-b border-slate-200 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Patient Photo</p>
              <div className="mx-auto mt-4 flex aspect-square max-w-[260px] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-inner">
                {capturedPhoto ? (
                  <img src={capturedPhoto} alt="Captured patient" className="h-full w-full object-cover" />
                ) : cameraStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full scale-x-[-1] object-cover"
                  />
                ) : (
                  <User className="h-20 w-20 text-slate-300" />
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              {cameraError && (
                <p className="mx-auto mt-3 max-w-[260px] text-xs font-bold leading-5 text-rose-600">
                  {cameraError}
                </p>
              )}

              {cameraStream ? (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-100 hover:bg-rose-700"
                    title="Capture photo"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
                    title="Cancel camera"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="mx-auto mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800"
                >
                  <Camera className="h-4 w-4" />
                  {capturedPhoto ? "Retake Photo" : "Take Photo"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-center">
              <div>
                <p className="text-xs font-black text-indigo-500">Registered</p>
                <p className="mt-1 text-2xl font-black text-indigo-700">12</p>
              </div>
              <div>
                <p className="text-xs font-black text-indigo-500">Pending</p>
                <p className="mt-1 text-2xl font-black text-indigo-700">4</p>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                Intake Checklist
              </div>
              <div className="mt-3 space-y-2 text-xs font-bold text-emerald-700">
                <p>Digital ID ready after registration</p>
                <p>Queue entry created automatically</p>
                <p>Doctor station receives visit reason</p>
              </div>
            </div>
          </aside>

          <section className="min-w-0 space-y-7">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Patient Details</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Standard Registration</p>
              </div>
              <label className="flex items-center gap-3 text-xs font-black uppercase tracking-wide text-slate-500">
                Emergency Mode
                <input
                  type="checkbox"
                  checked={emergencyMode}
                  onChange={(event) => {
                    setEmergencyMode(event.target.checked);
                    setPriority(event.target.checked ? "EMERGENCY" : "NORMAL");
                  }}
                  className="h-5 w-5 accent-rose-600"
                />
              </label>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-indigo-600">
                <Search className="h-4 w-4" />
                Search Existing Patient (Auto-Fill)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300" />
                <input
                  type="search"
                  placeholder="Type name, mobile number or UHID..."
                  className="h-12 w-full rounded-lg border border-indigo-100 bg-indigo-50/40 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-black uppercase tracking-wide text-slate-700">
                  <Contact className="h-4 w-4" />
                  Identity Proofs
                </h3>
                <span className="text-xs font-bold text-slate-400">Optional</span>
              </div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)]">
                <Field label="ABHA Address / Number">
                  <input value={abhaNumber} onChange={(e) => setAbhaNumber(e.target.value)} placeholder="12-3456-7890-1234" className="form-input" />
                </Field>
                <button type="button" className="mt-6 h-11 rounded-lg bg-orange-50 text-sm font-black text-orange-600 hover:bg-orange-100">
                  Verify
                </button>
                <Field label="Aadhaar Number">
                  <input value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} placeholder="12 digit Aadhaar number" className="form-input" />
                </Field>
              </div>
            </div>

            <FormSection title="Demographics">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="First Name" required>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="e.g. Rahul" className="form-input" />
                </Field>
                <Field label="Last Name" required>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="e.g. Verma" className="form-input" />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Age" required>
                  <input type="number" min={0} value={age} onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : "")} required placeholder="0" className="form-input" />
                </Field>
                <Field label="Gender" required>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="form-input">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Date of Birth">
                  <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="form-input" />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Contact Details">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Mobile Number" required>
                  <input value={mobile} onChange={(e) => setMobile(e.target.value)} required placeholder="10 digit number" className="form-input" />
                </Field>
                <Field label="Emergency Contact">
                  <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Optional" className="form-input" />
                </Field>
                <Field label="Email Address">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" className="form-input" />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Address & Location">
              <Field label="Street Address">
                <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="House no, street, locality" className="form-input" />
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="City">
                  <input value={city} onChange={(e) => setCity(e.target.value)} className="form-input" />
                </Field>
                <Field label="State">
                  <input value={stateName} onChange={(e) => setStateName(e.target.value)} className="form-input" />
                </Field>
                <Field label="Pincode">
                  <input value={pincode} onChange={(e) => setPincode(e.target.value)} className="form-input" />
                </Field>
              </div>
            </FormSection>

            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-black uppercase tracking-wide text-slate-700">
                <HeartPulse className="h-4 w-4 text-orange-500" />
                Clinical & Critical Info
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Known Allergies">
                  <input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin, peanuts" className="form-input border-amber-200 bg-white" />
                </Field>
                <Field label="Blood Group">
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="form-input border-amber-200 bg-white">
                    {bloodGroups.map((group) => (
                      <option key={group || "empty"} value={group}>
                        {group || "Select Blood Group"}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <FormSection title="Visit Details">
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Type">
                  <div className="grid h-11 grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1">
                    {(["OPD", "IPD"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setVisitType(type)}
                        className={`rounded-md text-sm font-black ${visitType === type ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Department">
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="form-input">
                    {departments.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Consulting Doctor">
                  <select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="form-input">
                    <option value="">Select Doctor</option>
                    {doctors.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
              </div>
            </FormSection>

            <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-black uppercase tracking-wide text-slate-700">
                <FileText className="h-4 w-4" />
                Reason for Visit / Symptoms
              </h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Describe the main complaints or reason for visiting..."
                className="form-input h-auto resize-y py-3"
              />
            </div>

            <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 py-5 backdrop-blur">
              <button
                type="submit"
                disabled={submitting || !fullName || !mobile || !age}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 text-base font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <ClipboardPlus className="h-5 w-5" />
                {submitting ? "Creating Patient..." : "Create Patient Profile & Add to Queue"}
              </button>
            </div>
          </section>
          </form>
        )}
      </div>
    </div>
  );
};

const getDateStatus = (day: number): Exclude<SlotStatus, "full"> => {
  return limitedDates.has(day) ? "limited" : "available";
};

const BookAppointmentWorkspace: React.FC = () => {
  const [appointmentVisitType, setAppointmentVisitType] = useState<AppointmentVisitType>("OPD");
  const [department, setDepartment] = useState("General Medicine");
  const [doctor, setDoctor] = useState("");
  const [selectedDay, setSelectedDay] = useState(2);
  const [selectedTime, setSelectedTime] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleDateSelect = (day: number) => {
    setSelectedDay(day);
    setSelectedTime("");
    setIsConfirmed(false);
  };

  const handleSlotSelect = (time: string) => {
    if (fullSlots.has(time)) return;
    setSelectedTime(time);
    setIsConfirmed(false);
  };

  const selectedDate = new Date(2026, 8, selectedDay);
  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  const ticketDate = selectedDate.toLocaleDateString("en-US");
  const queueToken = `Q-${100 + selectedDay}`;

  if (isConfirmed) {
    return (
      <section className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between bg-slate-800 px-7 py-6 text-white">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Appointment Confirmed</h2>
            <p className="mt-1 text-base font-medium text-slate-200">Ticket Generated Successfully</p>
          </div>
          <CheckCircle2 className="h-9 w-9 text-emerald-400" />
        </div>

        <div className="px-6 py-9">
          <div className="mx-auto max-w-xl rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-7">
            <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Hospital</p>
                <p className="mt-1 text-base font-black text-slate-950">Apollo Chain - Bangalore</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Date</p>
                <p className="mt-1 text-base font-black text-slate-950">{ticketDate}</p>
              </div>
            </div>

            <div className="mt-5 flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Patient Name</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">Guest Patient</p>
                <p className="mt-2 text-sm font-bold text-slate-600">
                  UHID: <span className="font-mono">TEMP-8832</span>
                </p>
              </div>
              <div className="grid h-[90px] w-[90px] shrink-0 grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-3">
                {Array.from({ length: 9 }, (_, index) => (
                  <span
                    key={index}
                    className={`rounded-sm ${
                      [0, 1, 3, 5, 6, 7].includes(index) ? "bg-slate-800" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <TicketField label="Department" value={department} />
              <TicketField label="Doctor" value={doctor || "Duty Doctor"} />
              <TicketField label="Type" value={`${appointmentVisitType} Consult`} />
              <TicketField label="Time Slot" value={selectedTime} />
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Queue Token</p>
              <p className="mt-1 text-2xl font-black text-sky-600">{queueToken}</p>
            </div>

            <p className="mt-7 border-t border-slate-200 pt-5 text-center text-sm font-medium text-slate-400">
              Please arrive 15 mins before your slot.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-7 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              Print Ticket
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTime("");
                setIsConfirmed(false);
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-7 text-sm font-black text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Book Another
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Patient Lookup</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search by Name, Mobile, or UHID..."
              className="h-14 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-base font-semibold text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[360px_minmax(360px,1fr)_460px]">
          <aside className="space-y-5">
            <Field label="Visit Type">
              <div className="grid grid-cols-3 gap-2">
                {(["OPD", "IPD", "Remote"] as const).map((type) => {
                  const active = appointmentVisitType === type;
                  const Icon = type === "OPD" ? Stethoscope : type === "IPD" ? Bed : Video;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAppointmentVisitType(type)}
                      className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-black transition-colors ${
                        active
                          ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {type}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Department">
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="form-input">
                {departments.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>

            <Field label="Consulting Doctor">
              <select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="form-input">
                <option value="">Any Available Doctor</option>
                {doctors.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Selected Slot</h3>
                <Info className="h-4 w-4 text-slate-400" />
              </div>

              {selectedTime ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-black tracking-tight text-slate-950">{selectedTime}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">{selectedDateLabel}</p>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsConfirmed(true)}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800"
                    >
                      Confirm Booking
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-sm font-semibold italic leading-6 text-slate-400">
                  Please select a date and time from the calendar.
                </p>
              )}
            </div>
          </aside>

          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-full max-w-[430px] rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-7 flex items-center justify-between">
                <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label="Previous month">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-xl font-black text-slate-950">September 2026</h3>
                <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label="Next month">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-3 text-center">
                {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => (
                  <div key={day} className="text-xs font-black text-slate-400">{day}</div>
                ))}
                <div />
                <div />
                {calendarDays.map((day) => {
                  const status = getDateStatus(day);
                  const active = selectedDay === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`relative flex h-10 items-center justify-center rounded-lg text-base font-black transition-colors ${
                        active
                          ? "bg-sky-600 text-white shadow-lg shadow-sky-100"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {day}
                      <span
                        className={`absolute bottom-1.5 h-1 w-1 rounded-full ${
                          status === "limited" ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-black uppercase text-slate-500">
              <AvailabilityLegend color="bg-emerald-500" label="Available" />
              <AvailabilityLegend color="bg-amber-500" label="Limited" />
              <AvailabilityLegend color="bg-rose-500" label="Full" />
              <AvailabilityLegend color="bg-slate-300" label="Closed" />
            </div>
          </div>

          <aside className="max-h-[555px] overflow-y-auto border-l border-slate-100 pl-7 pr-1">
            <div className="space-y-6">
              {appointmentSlots.map((group) => (
                <div key={group.period}>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-orange-600">
                    {group.icon}
                    {group.period}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.slots.map((slot) => {
                      const full = fullSlots.has(slot);
                      const active = selectedTime === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={full}
                          onClick={() => handleSlotSelect(slot)}
                          className={`relative h-11 rounded-lg border px-4 text-left text-sm font-black transition-colors ${
                            active
                              ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                              : full
                                ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through"
                                : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                          }`}
                        >
                          {slot}
                          {full ? (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-rose-500">
                              Full
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

const AvailabilityLegend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-2">
    <span className={`h-2 w-2 rounded-full ${color}`} />
    {label}
  </span>
);

const TicketField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-base font-black text-slate-950">{value}</p>
  </div>
);

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-black text-slate-700">
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
  </label>
);

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <section className="space-y-4">
    <h3 className="border-b border-slate-100 pb-2 text-base font-black uppercase tracking-wide text-slate-400">
      {title}
    </h3>
    {children}
  </section>
);

export default AddPatientPage;
