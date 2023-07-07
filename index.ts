/*
* Created by Sethu Senthil on July 7th, 2023

? https://sethusenthil.com

! MIT License

To run: deno run --allow-read --allow-write --allow-env --allow-net index.ts
*/

import { ThreadsAPI } from "npm:threads-api";
import { cron } from "https://deno.land/x/deno_cron@v1.0.0/cron.ts";
import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { TelegramBot } from "https://raw.githubusercontent.com/michael-spengler/telegram_chatbot/master/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

//get bot credentials
const bot = new TelegramBot(Deno.env.get("TELEGRAM_BOT_TOKEN")!);
const chatID: string = Deno.env.get("TELEGRAM_CHAT_ID")!;

const __dirname = new URL(".", import.meta.url).pathname;
const previousPostPath = path.join(__dirname, "previous-post.json");

//Map of month names to emojis that represent them
const monthEmojis: { [month: string]: string } = {
  January: "❄️",
  February: "💖",
  March: "🌸",
  April: "🌼",
  May: "🌷",
  June: "☀️",
  July: "🎆",
  August: "🌞",
  September: "🍂",
  October: "🎃",
  November: "🦃",
  December: "🎄",
};

//generate a ASCII progress bar based on the percentage provided
function generateProgressBar(percentage: number): string {
  if (percentage < 0 || percentage > 100) {
    throw new Error(
      "Invalid percentage. Please provide a value between 0 and 100."
    );
  }

  const completedLength = Math.floor((percentage / 100) * 16);
  const remainingLength = 16 - completedLength;

  const completedBlock = "▓".repeat(completedLength);
  const remainingBlock = "░".repeat(remainingLength);

  return completedBlock + remainingBlock;
}

//get the progress of the current year and month
async function getProgress(shouldPost = false) {
  try {
    const previousPostData = await Deno.readTextFile(previousPostPath);
    const previousPost = JSON.parse(previousPostData);

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // January 1st of the current year
    const endDate = new Date(currentYear + 1, 0, 1); // January 1st of the next year

    const currentTime = new Date();
    const elapsedTime = currentTime.getTime() - startDate.getTime();
    const totalTime = endDate.getTime() - startDate.getTime();
    const percentageElapsedYear = (elapsedTime / totalTime) * 100;
    const percentageElapsedYearRounded = Math.floor(percentageElapsedYear);

    //   console.log(
    //     `Percentage of the current year elapsed: ${percentageElapsedYearRounded}%`
    //   );

    const progressBarYear = generateProgressBar(percentageElapsedYearRounded);

    //   console.log(progressBarYear);

    const shoudlPostYear = !(
      previousPost.year.name == currentYear &&
      percentageElapsedYearRounded == previousPost.year.percent
    );

    if (shouldPost && shoudlPostYear) {
      await postThread(
        `💫 ${currentYear} is ${percentageElapsedYearRounded}% complete \n${progressBarYear}`
      );
      previousPost.year.name = currentYear;
      previousPost.year.percent = percentageElapsedYearRounded;
    }

    const currentMonth = currentTime.getMonth();
    const startMonth = new Date(currentYear, currentMonth, 1); // First day of the current month
    const endMonth = new Date(currentYear, currentMonth + 1, 1); // First day of the next month

    const elapsedTimeMonth = currentTime.getTime() - startMonth.getTime();
    const totalTimeMonth = endMonth.getTime() - startMonth.getTime();
    const percentageElapsedMonth = (elapsedTimeMonth / totalTimeMonth) * 100;
    const percentageElapsedMonthRounded = Math.floor(percentageElapsedMonth);

    const currentMonthName = currentTime.toLocaleString("default", {
      month: "long",
    });

    //   console.log(
    //     `Percentage of the current ${currentMonthName} elapsed: ${percentageElapsedMonthRounded}%`
    //   );

    const progressBarMonth = generateProgressBar(percentageElapsedMonthRounded);

    //   console.log(generateProgressBar(percentageElapsedMonthRounded));

    const shoudlPostMonth = !(
      previousPost.month.name == currentMonthName &&
      percentageElapsedMonthRounded == previousPost.month.percent
    );

    if (shouldPost && shoudlPostMonth) {
      postThread(
        `${monthEmojis[currentMonthName]} ${currentMonthName} is ${percentageElapsedMonthRounded}% complete \n${progressBarMonth}`
      );
      previousPost.month.name = currentMonthName;
      previousPost.month.percent = percentageElapsedMonthRounded;
    }

    if (shouldPost) {
      await Deno.writeTextFile(previousPostPath, JSON.stringify(previousPost));
    }
  } catch (e) {
    console.log(e);
    try {
      //send error message to telegram
      bot.sendMessage({
        chat_id: chatID,
        text: `Error: ${e}`,
      });
    } catch (e) {
      console.log("could not send error message to telegram", e);
    }
  }
}

async function postThread(text: string, randomWait = false) {
  console.log(text);
  if (randomWait) {
    //wait for a random amount of time between 0 and 300 seconds
    const randomWaitTime = Math.floor(Math.random() * 300);
    await new Promise((resolve) => setTimeout(resolve, randomWaitTime * 1000));
  }
  // Create a new thread post using the (unofficial) Threads API
  //TODO: Update ThreadsAPI library to add the ability to post / write threads

  //after posting
  await bot.sendMessage({
    chat_id: chatID,
    text: `Posted: ${text} link to thread: ${"thread link here"}`,
  });
}

//run immediately
getProgress(true);

//schedule run at 12:02 AM (Midnight) every day
cron("2 0 * * *", () => getProgress(true));

// 2: Specifies the minute when the cron job should run (2 minutes past the hour).
// 0: Specifies the hour when the cron job should run (midnight).
// *: The asterisks represent every day of the month, every month, and every day of the week.
