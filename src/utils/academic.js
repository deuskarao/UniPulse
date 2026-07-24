export function getCurrentAcademicYear(date = new Date()) {
  return date.getMonth() < 8 ? date.getFullYear() - 1 : date.getFullYear();
}

export function getClassYear(enrollmentYear, date = new Date()) {
  if (!enrollmentYear) return null;
  return getCurrentAcademicYear(date) - Number(enrollmentYear) + 1;
}

export function formatClassYear(enrollmentYear, t, date = new Date()) {
  const classYear = getClassYear(enrollmentYear, date);
  if (classYear === null) return "-";
  return classYear > 0 ? `${classYear}. ${t("Sınıf")}` : t("Hazırlık");
}

export function isCreditBearingGrade(harf) {
  return harf !== "EK" && harf !== "-";
}

export function isPassedGrade(harf, gano = 0) {
  if (harf === "FF" || harf === "DZ" || harf === "-" || harf === "EK") return false;
  if ((harf === "DD" || harf === "DC") && Number(gano) < 2.0) return false;
  return true;
}
