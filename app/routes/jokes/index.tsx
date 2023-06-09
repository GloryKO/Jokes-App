import { db } from "~/utils/db.server"
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

export const loader = async () => {
  const count = await db.joke.count()
  const randomROwNumber = Math.floor(Math.random() * count)
  const [randomJoke] = await db.joke.findMany({
    take: 1,
    skip: randomROwNumber
  })
  return json({ randomJoke })
}

const JokesIndexRoute = () => {
  const { randomJoke } = useLoaderData<typeof loader>()
  return (
    <div>
      <p>Here's a random joke:</p>
      <p>
        {randomJoke.content}
      </p>
      <Link to={randomJoke.id}>"{randomJoke.name}" Permalink</Link>
    </div>
  )
}

export default JokesIndexRoute