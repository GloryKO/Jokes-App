import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { requireUserID } from "~/utils/session.server";

const validateJokeContent = (content: string) => {
  if (content.length < 10) {
    return `That joke is too short`
  }
}
const validateJokeName = (name: string) => {
  if (name.length < 3) {
    return `That joke's name is too short`
  }
}

export const action = async ({ request }: ActionArgs) => {
  const userID = await requireUserID(request)
  const form = await request.formData()
  const name = form.get('name')
  const content = form.get('content')

  if (typeof name !== 'string' || typeof content !== 'string') {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: `Form not submitted correctly`
    })
  }

  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content)
  }

  const fields = { name, content }

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null,
    });
  }

  const joke = await db.joke.create({ data: { ...fields, jokesterID: userID } })
  return redirect(`/jokes/${joke.id}`)
}

const NewJokeRoute = () => {
  const actionData = useActionData<typeof action>()
  return (
    <div>
      <p>Add your own hilarious joke</p>
      <form method="post">
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={actionData?.fields?.name ?? ''}
            aria-invalid={Boolean(actionData?.fieldErrors?.name)}
            aria-errormessage={actionData?.fieldErrors?.name ? 'name-error' : undefined}
          />
          {actionData?.fieldErrors?.name ? (
            <p
              className="form-validation-error"
              role="alert"
              id="name-error"
            >
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="content">Content:</label>
          <textarea
            name="content"
            id="content"
            defaultValue={actionData?.fields?.content ?? ''}
            aria-invalid={Boolean(actionData?.fieldErrors?.content)}
            aria-errormessage={actionData?.fieldErrors?.content ? 'name-error' : undefined}></textarea>
          {actionData?.fieldErrors?.content ? (
            <p
              className="form-validation-error"
              role="alert"
              id="content-error"
            >
              {actionData.fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewJokeRoute;
