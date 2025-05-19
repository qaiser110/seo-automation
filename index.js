import "dotenv/config";
// import axios from "axios";
import { getJson } from "serpapi";
import { supabase } from "./supabaseClient.js";
import { sendEmail } from "./mailer.js";

const SERP_API_KEY = process.env.SERP_API_KEY;
const SEED_KEYWORD = process.env.SEED_KEYWORD; // "t-shirts, hoodies, mugs"
const seedKeywords = SEED_KEYWORD.split(",").map((k) => k.trim());

const SUGGESTIONS_PER_KEYWORD = 3;
// const totalIdeasToEmail = SUGGESTIONS_PER_KEYWORD * seedKeywords.length;

async function fetchKeywords() {
  let allKeywords = [];

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
    const filteredKeywords = suggestions
      .map((s) => s.value)
      .filter((k) => k.length > 10)
      .slice(0, SUGGESTIONS_PER_KEYWORD);

    allKeywords = [...allKeywords, ...filteredKeywords];
  }

  return allKeywords;
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

// async function generateContentIdeas() {
//   const { data, error } = await supabase
//     .from("keywords")
//     .select("keyword")
//     .limit(totalIdeasToEmail)
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Fetch error:", error);
//     return [];
//   }

//   return data.map((d) => `Buy ${d.keyword} at discount`);
// }

async function main() {
  const keywords = await fetchKeywords();
  await storeKeywords(keywords);

  // const ideas = await generateContentIdeas();

  const ideas = keywords;
  // const content = ideas.slice(0, totalIdeasToEmail).join("\n");
  const content = ideas.map((d) => `Buy ${d.keyword} at discount`).join("\n");

  // console.log("📌 Weekly Content Ideas:\n", content);

  await sendEmail("Your Weekly Content Ideas", content);
}

main();
