import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";

export const loader = async ({ params: { jokeID } }: LoaderArgs) => {
  const joke = await db.joke.findUnique({
    where: { id: jokeID }
  })

  if (!joke) {
    throw new Error("Joke not found")
  }

  return json({ joke })
}

const JokeRoute = () => {
  const { joke } = useLoaderData<typeof loader>()

  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>
        {joke.content}
      </p>
      <Link to='.'>{joke.name} Permalink</Link>
    </div>
  );
};

export default JokeRoute;
