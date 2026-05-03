import React, { useState, useEffect, useMemo } from 'react';

// ─── دوال التحويل بين التقويمين ───────────────────────────────────────────

function gregorianToJDN(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return d + Math.floor((153 * mo + 2) / 5) + 365 * yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
}

function jdnToGregorian(jdn: number) {
  const n = Math.floor(jdn) + 32044;
  const g = Math.floor((4 * n + 3) / 146097);
  const dg = n - Math.floor(146097 * g / 4);
  const c = Math.floor((4 * dg + 3) / 1461);
  const dc = dg - Math.floor(1461 * c / 4);
  const b = Math.floor((5 * dc + 2) / 153);
  const day = dc - Math.floor((153 * b + 2) / 5) + 1;
  const month = b + 3 - 12 * Math.floor(b / 10);
  return { year: 100 * g + c - 4800 + Math.floor(b / 10), month: Math.floor(month), day: Math.floor(day) };
}

function isHijriLeap(year: number) {
  return (14 + 11 * year) % 30 < 11;
}

function hijriMonthDays(year: number, month: number) {
  if (month <= 0 || month > 12 || year <= 0 || (month === 12 && isHijriLeap(year))) return 30;
  return 29 + month % 2;
}

function hijriToJDN(year: number, month: number, day: number) {
  return day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354 + Math.floor((3 + 11 * year) / 30) + 1948439.5 - 1;
}

function hijriFirstDow(year: number, month: number, day: number) {
  return (Math.round(hijriToJDN(year, month, day)) + 1) % 7;
}

function hijriToGregorian(year: number, month: number, day: number) {
  return jdnToGregorian(hijriToJDN(year, month, day));
}

function gregorianToHijri(y: number, m: number, d: number) {
  const x = gregorianToJDN(y, m, d) - 1948440 + 10632;
  const n = Math.floor((x - 1) / 10631);
  const X = x - 10631 * n + 354;
  const nl = Math.floor((10985 - X) / 5316) * Math.floor(50 * X / 17719) +
             Math.floor(X / 5670) * Math.floor(43 * X / 15238);
  const U = X - Math.floor((30 - nl) / 15) * Math.floor(17719 * nl / 50) -
            Math.floor(nl / 16) * Math.floor(15238 * nl / 43) + 29;
  const month = Math.floor(24 * U / 709);
  const day = U - Math.floor(709 * month / 24);
  return { year: Math.floor(30 * n + nl - 30), month: Math.floor(month), day: Math.floor(day) };
}

function gregorianMonthDays(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function dateDiff(from: any, to: any, isHijri: boolean) {
  let years = to.year - from.year;
  let months = to.month - from.month;
  let days = to.day - from.day;
  if (days < 0) {
    months--;
    const prevMonth = to.month === 1 ? 12 : to.month - 1;
    const prevYear = to.month === 1 ? to.year - 1 : to.year;
    days += isHijri ? hijriMonthDays(prevYear, prevMonth) : gregorianMonthDays(prevYear, prevMonth);
  }
  if (months < 0) { years--; months += 12; }
  return { years, months, days };
}

function isValidDate(d: number, m: number, y: number, isHijri: boolean) {
  if (isNaN(d) || isNaN(m) || isNaN(y) || m < 1 || m > 12 || y <= 0) return false;
  const maxDay = isHijri ? hijriMonthDays(y, m) : gregorianMonthDays(y, m);
  return d >= 1 && d <= maxDay;
}

// ─── ثوابت ───────────────────────────────────────────────────────────────

const HIJRI_MONTHS = ['محرم','صفر','ربيع الأول','ربيع الثاني','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
const HIJRI_DAYS   = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
const GREG_MONTHS  = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const GREG_DAYS    = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

const TODAY_HIJRI_YEAR = gregorianToHijri(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()).year;

interface DateValue {
  day: number | string;
  month: number | string;
  year: number | string;
}

// ─── منتقي التاريخ الهجري ────────────────────────────────────────────────

function HijriPicker({ isOpen, onClose, onSelect, currentValue }: any) {
  const getInitialView = () => {
    if (currentValue && currentValue.year && currentValue.month)
      return { year: Number(currentValue.year), month: Number(currentValue.month) };
    const today = new Date();
    const h = gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return { year: h.year, month: h.month };
  };

  const [view, setView] = useState(getInitialView());
  const [selectedDay, setSelectedDay] = useState<number | string | null>(currentValue?.day || null);

  useEffect(() => {
    if (isOpen) {
      setView(getInitialView());
      setSelectedDay(currentValue?.day || null);
    }
  }, [isOpen, currentValue]);

  const years = useMemo(() => {
    const list = [];
    const max = Math.max(1460, TODAY_HIJRI_YEAR + 10);
    for (let y = max; y >= 1350; y--) list.push(y);
    return list;
  }, []);

  const days = useMemo(() => {
    const total = hijriMonthDays(view.year, view.month);
    const offset = hijriFirstDow(view.year, view.month, 1);
    const grid = Array(offset).fill(null);
    for (let d = 1; d <= total; d++) grid.push(d);
    return grid;
  }, [view]);

  const changeMonth = (delta: number) => {
    setView(v => {
      let m = v.month + delta, y = v.year;
      if (m > 12) { m = 1; y++; }
      if (m < 1)  { m = 12; y--; }
      return { year: y, month: m };
    });
  };

  const selectDay = (d: number) => onSelect({ day: d, month: view.month, year: view.year });

  const selectToday = () => {
    const today = new Date();
    const h = gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
    onSelect({ day: h.day, month: h.month, year: h.year });
  };

  const clear = () => { onSelect({ day: '', month: '', year: '' }); onClose(); };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-lg w-full max-w-sm p-4 text-[#333333] transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="header bg-[#00796B] text-white p-4 rounded-t-md -m-4 mb-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="font-bold text-lg">{HIJRI_MONTHS[view.month - 1]}</span>
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="relative text-center">
            <select
              value={view.year}
              onChange={e => setView(v => ({ ...v, year: Number(e.target.value) }))}
              className="bg-transparent text-white font-semibold appearance-none text-center cursor-pointer focus:outline-none w-full"
            >
              {years.map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-1/2 translate-x-12 flex items-center px-2 text-white">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {HIJRI_DAYS.map(d => <div key={d} className="font-medium text-xs text-gray-500">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, i) => {
            const isSelected = Number(selectedDay) === d && Number(currentValue?.month) === view.month && Number(currentValue?.year) === view.year;
            return (
              <div key={i} className="p-1">
                {d ? (
                  <button
                    onClick={() => selectDay(d as number)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all duration-200 ${isSelected ? 'bg-[#00796B] text-white font-bold shadow-md' : 'hover:bg-[#00796B]/20 hover:font-semibold'}`}
                  >{d}</button>
                ) : <div />}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-[#004D61] hover:bg-gray-100 rounded-md font-medium transition-colors">إغلاق</button>
          <button onClick={clear}  className="px-4 py-2 text-sm text-gray-600 hover:text-[#004D61] hover:bg-gray-100 rounded-md font-medium transition-colors">مسح</button>
          <button onClick={selectToday} className="px-4 py-2 text-sm bg-[#00796B] text-white rounded-md hover:bg-[#004D61] font-bold transition-colors shadow">اليوم</button>
        </div>
      </div>
    </div>
  );
}

// ─── منتقي التاريخ الميلادي ───────────────────────────────────────────────

function GregorianPicker({ isOpen, onClose, onSelect, currentValue }: any) {
  const getInitialView = () => {
    if (currentValue && currentValue.year && currentValue.month)
      return { year: Number(currentValue.year), month: Number(currentValue.month) };
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  };

  const [view, setView] = useState(getInitialView());
  const [selectedDay, setSelectedDay] = useState<number | string | null>(currentValue?.day || null);

  useEffect(() => {
    if (isOpen) {
      setView(getInitialView());
      setSelectedDay(currentValue?.day || null);
    }
  }, [isOpen, currentValue]);

  const years = useMemo(() => {
    const list = [];
    for (let y = 2040; y >= 1920; y--) list.push(y);
    return list;
  }, []);

  const days = useMemo(() => {
    const total = gregorianMonthDays(view.year, view.month);
    const offset = new Date(view.year, view.month - 1, 1).getDay();
    const grid = Array(offset).fill(null);
    for (let d = 1; d <= total; d++) grid.push(d);
    return grid;
  }, [view]);

  const changeMonth = (delta: number) => {
    setView(v => {
      let m = v.month + delta, y = v.year;
      if (m > 12) { m = 1; y++; }
      if (m < 1)  { m = 12; y--; }
      return { year: y, month: m };
    });
  };

  const selectDay = (d: number) => onSelect({ day: d, month: view.month, year: view.year });

  const selectToday = () => {
    const today = new Date();
    onSelect({ day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() });
  };

  const clear = () => { onSelect({ day: '', month: '', year: '' }); onClose(); };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-lg w-full max-w-sm p-4 text-[#333333] transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="header bg-[#00796B] text-white p-4 rounded-t-md -m-4 mb-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="font-bold text-lg">{GREG_MONTHS[view.month - 1]}</span>
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="relative text-center">
            <select
              value={view.year}
              onChange={e => setView(v => ({ ...v, year: Number(e.target.value) }))}
              className="bg-transparent text-white font-semibold appearance-none text-center cursor-pointer focus:outline-none w-full"
            >
              {years.map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-1/2 translate-x-12 flex items-center px-2 text-white">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {GREG_DAYS.map(d => <div key={d} className="font-medium text-xs text-gray-500">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, i) => {
            const isSelected = Number(selectedDay) === d && Number(currentValue?.month) === view.month && Number(currentValue?.year) === view.year;
            return (
              <div key={i} className="p-1">
                {d ? (
                  <button
                    onClick={() => selectDay(d as number)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all duration-200 ${isSelected ? 'bg-[#00796B] text-white font-bold shadow-md' : 'hover:bg-[#00796B]/20 hover:font-semibold'}`}
                  >{d}</button>
                ) : <div />}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-[#004D61] hover:bg-gray-100 rounded-md font-medium transition-colors">إغلاق</button>
          <button onClick={clear}  className="px-4 py-2 text-sm text-gray-600 hover:text-[#004D61] hover:bg-gray-100 rounded-md font-medium transition-colors">مسح</button>
          <button onClick={selectToday} className="px-4 py-2 text-sm bg-[#00796B] text-white rounded-md hover:bg-[#004D61] font-bold transition-colors shadow">اليوم</button>
        </div>
      </div>
    </div>
  );
}

// ─── مكونات مساعدة ────────────────────────────────────────────────────────

function Section({ title, description, children }: any) {
  return (
    <div className="py-2">
      <h3 className="text-xl font-bold text-[#004D61]">{title}</h3>
      <p className="text-md text-gray-600 mb-3">{description}</p>
      {children}
    </div>
  );
}

function DateButton({ value, onClick, error, isHijri }: any) {
  const monthsArr = isHijri ? HIJRI_MONTHS : GREG_MONTHS;
  
  // نعرض التاريخ بالشكل الصحيح والكامل: 12 أكتوبر 2024
  const label = value.year && value.month && value.day
    ? `${Math.floor(Number(value.day))} ${monthsArr[Number(value.month) - 1]} ${Math.floor(Number(value.year))}`
    : 'اختر تاريخاً';

  return (
    <div>
      <button
        onClick={onClick}
        className={`w-full px-4 py-3 text-right bg-white border rounded-lg shadow-sm cursor-pointer flex justify-between items-center transition-all duration-200 hover:border-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00796B] focus:ring-offset-2 ${error ? 'border-red-500' : 'border-gray-200'}`}
        aria-label="اختر تاريخاً"
      >
        <span className={value.year ? 'text-[#333333]' : 'text-gray-400'}>{label}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm-1 8a1 1 0 100 2h12a1 1 0 100-2H5z" clipRule="evenodd" />
        </svg>
      </button>
      {error && <p className="text-red-600 text-sm mt-2" role="alert">{error}</p>}
    </div>
  );
}

function ResultCard({ title, children }: any) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-inner border border-gray-200 flex flex-col justify-center min-h-[100px]">
      <h4 className="text-md text-[#004D61] font-semibold text-center mb-2">{title}</h4>
      <div className="text-lg font-bold text-[#333333] tracking-wider text-center">{children}</div>
    </div>
  );
}

// ─── المكون الرئيسي ───────────────────────────────────────────────────────

export default function App() {
  const emptyDate = { day: '', month: '', year: '' };

  const [hijriDob,     setHijriDob]     = useState<DateValue>(emptyDate);
  const [gregorianDob, setGregorianDob] = useState<DateValue>(emptyDate);
  const [studyDate,    setStudyDate]    = useState<DateValue>(emptyDate);

  const [hijriAge,     setHijriAge]     = useState<any>(null);
  const [gregorianAge, setGregorianAge] = useState<any>(null);
  const [studyAge,     setStudyAge]     = useState<any>(null);

  const [showResults,  setShowResults]  = useState(false);
  const [openPicker,   setOpenPicker]   = useState<string | null>(null);
  const [errors,       setErrors]       = useState({ dob: '', study: '' });

  // ── حساب ──────────────────────────────────────────────────────────────
  const calculate = () => {
    setHijriAge(null);
    setGregorianAge(null);
    setStudyAge(null);
    setShowResults(false);

    const errs = { dob: '', study: '' };
    let hasError = false;
    let hijriResult = null, gregorianResult = null, studyResult = null;

    const hD = Math.floor(Number(hijriDob.day)), hM = Math.floor(Number(hijriDob.month)), hY = Math.floor(Number(hijriDob.year));

    if (hD || hM || hY) {
      if (isValidDate(hD, hM, hY, true)) {
        const today      = new Date();
        const todayGreg  = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
        const todayHijri = gregorianToHijri(todayGreg.year, todayGreg.month, todayGreg.day);
        const dobGreg    = hijriToGregorian(hY, hM, hD);

        gregorianResult = dateDiff(dobGreg, todayGreg, false);
        hijriResult     = dateDiff({ day: hD, month: hM, year: hY }, todayHijri, true);

        setGregorianAge(gregorianResult);
        setHijriAge(hijriResult);
      } else {
        errs.dob = 'الرجاء إدخال تاريخ ميلاد صحيح.';
        hasError = true;
      }
    }

    const sD = Math.floor(Number(studyDate.day)), sM = Math.floor(Number(studyDate.month)), sY = Math.floor(Number(studyDate.year));

    if (sD || sM || sY) {
      if (!isValidDate(hD, hM, hY, true)) {
        errs.study = 'الرجاء إدخال تاريخ الميلاد أولاً.';
        hasError = true;
      } else if (isValidDate(sD, sM, sY, true)) {
        const dobGreg   = hijriToGregorian(hY, hM, hD);
        const studyGreg = hijriToGregorian(sY, sM, sD);
        if (gregorianToJDN(studyGreg.year, studyGreg.month, studyGreg.day) <
            gregorianToJDN(dobGreg.year,   dobGreg.month,   dobGreg.day)) {
          errs.study = 'تاريخ بدء الدراسة يجب أن يكون بعد تاريخ الميلاد.';
          hasError = true;
        } else {
          studyResult = dateDiff(dobGreg, studyGreg, false);
          setStudyAge(studyResult);
        }
      } else {
        errs.study = 'تاريخ بدء الدراسة غير صالح.';
        hasError = true;
      }
    }

    setErrors(errs);
    if (!hasError && (hijriResult || gregorianResult || studyResult)) {
      setShowResults(true);
    } else if (!hD && !hM && !hY && !sD && !sM && !sY) {
      setErrors({ dob: '', study: '' });
    }
  };

  const onSelectHijriDob = (val: any) => {
    setHijriDob(val);
    setOpenPicker(null);
    const d = Number(val.day), m = Number(val.month), y = Number(val.year);
    if (isValidDate(d, m, y, true)) {
      setGregorianDob(hijriToGregorian(y, m, d));
    } else if (!val.day && !val.month && !val.year) {
      setGregorianDob(emptyDate);
    }
  };

  const onSelectGregorianDob = (val: any) => {
    setGregorianDob(val);
    setOpenPicker(null);
    const d = Number(val.day), m = Number(val.month), y = Number(val.year);
    if (isValidDate(d, m, y, false)) {
      setHijriDob(gregorianToHijri(y, m, d));
    } else if (!val.day && !val.month && !val.year) {
      setHijriDob(emptyDate);
    }
  };

  return (
    <div className="min-h-screen text-[#333] font-sans" dir="rtl">
      <main className="w-full flex justify-center py-8 px-4 font-sans">
        <div className="w-full max-w-4xl mx-auto bg-gray-50 rounded-2xl shadow-2xl overflow-hidden"
             style={{ boxShadow: '0 4px 20px rgba(0,77,97,0.15)' }}>

          <header className="p-6 text-center">
            <div className="flex justify-center items-center gap-6 mb-6">
              <div className="flex flex-col items-end space-y-2">
                <div className="h-0.5 w-12 bg-[#00796B] rounded-full" />
                <div className="h-1 w-24 bg-[#00796B] rounded-full" />
              </div>
              <div className="relative h-24 w-24 flex-shrink-0 rounded-full overflow-hidden shadow-lg border-4 border-white/80">
                <img src="https://up6.cc/2025/10/176241789454741.jpg" alt="شعار وزارة التعليم" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col items-start space-y-2">
                <div className="h-0.5 w-12 bg-[#00796B] rounded-full" />
                <div className="h-1 w-24 bg-[#00796B] rounded-full" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-[#00796B] tracking-tight">حاسبة العمر وبداية الدراسة</h1>
            <p className="text-lg text-[#00796B] font-medium mt-2">معهد النور للبنات بجدة</p>
          </header>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              <Section title="أولاً: العمر بالهجري" description="تاريخ الميلاد">
                <DateButton value={hijriDob} onClick={() => setOpenPicker('hijriDob')} error={errors.dob} isHijri={true} />
              </Section>

              <Section title="ثانياً: العمر بالميلادي" description="تاريخ الميلاد">
                <DateButton value={gregorianDob} onClick={() => setOpenPicker('gregorianDob')} error={errors.dob} isHijri={false} />
              </Section>

              <Section title="ثالثاً: عمر بدء الدراسة" description="أدخل تاريخ الميلاد بالأعلى">
                {/* User usually inserts hijri study dates, but we keep it Hijri picker as in original */}
                <DateButton value={studyDate} onClick={() => setOpenPicker('study')} error={errors.study} isHijri={true} />
              </Section>

            </div>

            <div className="mt-8">
              <button
                onClick={calculate}
                className="w-full px-6 py-4 bg-[#00796B] text-white rounded-lg font-bold text-xl hover:bg-[#004D61] transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-[#00796B] focus:ring-offset-2"
              >احسب الآن</button>
            </div>

            {showResults && (
              <div className="mt-8 border-t-2 border-dashed border-gray-200 pt-6">
                <h3 className="text-2xl font-bold text-[#00796B] text-center mb-4">النتائج</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hijriAge && gregorianAge && (
                    <>
                      <ResultCard title="عمرك بالهجري">
                        {`${hijriAge.years} سنة, ${hijriAge.months} شهر, ${hijriAge.days} يوم`}
                      </ResultCard>
                      <ResultCard title="عمرك بالميلادي">
                        {`${gregorianAge.years} سنة, ${gregorianAge.months} شهر, ${gregorianAge.days} يوم`}
                      </ResultCard>
                    </>
                  )}
                  {studyAge && (
                    <ResultCard title="العمر عند بدء الدراسة">
                      {`${studyAge.years} سنة, ${studyAge.months} شهر, ${studyAge.days} يوم`}
                    </ResultCard>
                  )}
                </div>
              </div>
            )}
          </div>

          <footer className="text-center p-6 bg-white/50 border-t border-gray-200">
            <p className="text-sm text-[#333333]">© {new Date().getFullYear()} - كل الحقوق محفوظة لمعهد النور للبنات بجدة</p>
            <p className="text-sm text-gray-500 mt-2">التنفيذ: حنين النعمي</p>
          </footer>
        </div>

        <HijriPicker
          isOpen={openPicker === 'hijriDob'}
          onClose={() => setOpenPicker(null)}
          onSelect={onSelectHijriDob}
          currentValue={hijriDob}
        />
        <GregorianPicker
          isOpen={openPicker === 'gregorianDob'}
          onClose={() => setOpenPicker(null)}
          onSelect={onSelectGregorianDob}
          currentValue={gregorianDob}
        />
        <HijriPicker
          isOpen={openPicker === 'study'}
          onClose={() => setOpenPicker(null)}
          onSelect={(val: any) => { setStudyDate(val); setOpenPicker(null); }}
          currentValue={studyDate}
        />
      </main>
    </div>
  );
}
