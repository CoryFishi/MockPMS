import { supabase } from "@app/supabaseClient";

export async function addEvent(eventName, eventDescription, completed) {
  try {
    const { data, error } = await supabase.from("user_events").insert([
      {
        event_name: eventName,
        event_description: eventDescription,
        completed: completed,
      },
    ]);
    if (error) {
      console.error("Error inserting new event:", error);
    }
    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    throw err;
  }
}
