import "dotenv/config";
import axios from "axios";
import { supabase } from "./supabaseClient.js";

const SERP_API_KEY = process.env.SERP_API_KEY;
const SEED_KEYWORD = process.env.SEED_KEYWORD;

async function fetchKeywords() {
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(
    SEED_KEYWORD
  )}&engine=google_autocomplete&api_key=${SERP_API_KEY}`;
  const res = await axios.get(url);
  const suggestions = res.data.suggestions || [];

  const keywords = suggestions.map((s) => s.value).filter((k) => k.length > 10); // filter short/low intent terms

  return keywords;
}

async function storeKeywords(keywords) {
  for (let keyword of keywords) {
    await supabase
      .from("keywords")
      .insert([{ keyword }])
      .then(({ error }) => {
        if (error) console.error("Insert error:", error);
      });
  }
}

async function generateContentIdeas() {
  const { data, error } = await supabase
    .from("keywords")
    .select("keyword")
    .limit(5)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  const ideas = data.map((d) => `How to ${d.keyword}`);
  console.log("📌 Weekly Content Ideas:\n", ideas.slice(0, 3).join("\n"));
}

async function main() {
  const keywords = await fetchKeywords();
  await storeKeywords(keywords);
  await generateContentIdeas();
}

main();
