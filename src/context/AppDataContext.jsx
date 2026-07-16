import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useI18n } from "./I18nContext";

const AppDataContext = createContext(null);

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export function AppDataProvider({ children }) {
  const [harfNotlari, setHarfNotlari] = useState([]);
  const [harfRenk, setHarfRenk] = useState({});
  const [ganoRenkler, setGanoRenkler] = useState([]);
  const [bosDers, setBosDers] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [facultyDepartments, setFacultyDepartments] = useState([]);
  const [appDataLoading, setAppDataLoading] = useState(true);
  const [appDataError, setAppDataError] = useState(null);
  const { language } = useI18n();

  useEffect(() => {
    async function loadAppData() {
      try {
        setAppDataLoading(true);
        const [hnData, hrData, grData, bdData, uniData, facData, fdData] = await Promise.all([
          supabase.from("harf_notlari").select("*").order("min", { ascending: false }),
          supabase.from("harf_renkler").select("*"),
          supabase.from("gano_renkler").select("*").order("min_gano", { ascending: false }),
          supabase.from("default_course").select("value").eq("key", "bos_ders").maybeSingle(),
          supabase.from("universities").select("*").order("ad"),
          supabase.from("faculties").select("*").order("ad"),
          supabase.from("faculty_departments").select("*, faculties(*)"),
        ]);

        const error = hnData.error || hrData.error || grData.error || bdData.error || uniData.error || facData.error || fdData.error;
        if (error) throw error;

        const mapAd = (data) => {
          if (!data) return data;
          return data.map(item => {
            const translation = language !== "tr" && item[`ad_${language}`];
            return { ...item, original_ad: item.ad, ad: translation ? translation : item.ad };
          });
        };

        if (hnData.data) setHarfNotlari(hnData.data);
        if (hrData.data) {
          const map = {};
          hrData.data.forEach((d) => {
            map[d.harf] = d.renk;
          });
          setHarfRenk(map);
        }
        if (grData.data) setGanoRenkler(grData.data);
        if (bdData.data?.value) setBosDers(bdData.data.value);
        if (uniData.data) setUniversities(mapAd(uniData.data));
        if (facData.data) setFaculties(mapAd(facData.data));
        if (fdData.data) setFacultyDepartments(fdData.data);
      } catch (err) {
        console.error("Uygulama verisi yükleme hatası:", err);
        setAppDataError("Uygulama verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      } finally {
        setAppDataLoading(false);
      }
    }
    loadAppData();
  }, [language]);

  return (
    <AppDataContext.Provider
      value={{ harfNotlari, harfRenk, ganoRenkler, bosDers, universities, faculties, facultyDepartments, appDataLoading, appDataError }}
    >
      {children}
    </AppDataContext.Provider>
  );
}