import "dotenv/config";
import axios from "axios";
import { getJson } from "serpapi";
import { supabase } from "./supabaseClient.js";
import { sendEmail } from "./mailer.js";

const SERP_API_KEY = process.env.SERP_API_KEY;
const SEED_KEYWORD = process.env.SEED_KEYWORD; // "t-shirts, hoodies, mugs"
const EMAIL_IDEAS_QTY = 15;
const SUGGESTIONS_PER_KEYWORD = 15;

async function fetchKeywords() {
  const seedKeywords = SEED_KEYWORD.split(",").map((k) => k.trim());
  let keywords = [];

  for (const seed of seedKeywords) {
    const data = await getJson({
      q: seed,
      api_key: SERP_API_KEY,
      engine: "google_autocomplete",
      location: "United States",
      google_domain: "google.com",
      gl: "us",
      hl: "en",
    });

    const suggestions = data.suggestions || [];
    const seedKeywords = suggestions
      .slice(0, SUGGESTIONS_PER_KEYWORD)
      .map((s) => s.value)
      .filter((k) => k.length > 10);

    keywords = [...keywords, ...seedKeywords];
  }

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
    .limit(EMAIL_IDEAS_QTY)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }

  return data.map((d) => `Buy ${d.keyword} at discount`);
}

async function main() {
  const keywords = await fetchKeywords();
  await storeKeywords(keywords);

  const ideas = await generateContentIdeas();
  const content = ideas.slice(0, EMAIL_IDEAS_QTY).join("\n");
  console.log("📌 Weekly Content Ideas:\n", content);

  await sendEmail("Your Weekly Content Ideas", content);
}

main();
