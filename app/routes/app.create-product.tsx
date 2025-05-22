import {
  json,
  redirect,
  ActionFunction,
} from '@remix-run/node'
import {
  useActionData,
  Form,
  useNavigation,
  useLocation,
} from '@remix-run/react'
import {
  Page,
  Layout,
  TextField,
  Button,
  BlockStack,
  Text,
  Toast,
  Frame,
} from '@shopify/polaris'
import { useState, useEffect } from 'react'
import { authenticate } from '../shopify.server'
import { CREATE_PRODUCT_MUTATION } from '../utils/shopifyQueries'

export const action: ActionFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request)
  const formData = await request.formData()

  const title = formData.get('title')
  const descriptionHtml = formData.get('descriptionHtml')

  if (typeof title !== 'string' || typeof descriptionHtml !== 'string') {
    return json({ error: 'Invalid form submission' })
  }

  const response = await admin.graphql(CREATE_PRODUCT_MUTATION, {
    variables: {
      input: {
        title,
        descriptionHtml,
      },
    },
  })

  const data = await response.json()
  const errors = data?.data?.productCreate?.userErrors || []

  if (errors.length > 0) {
    return json({ errors })
  }

  return redirect('/app/create-product?success=true')
}

export default function CreateProductPage() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const location = useLocation()

  const [title, setTitle] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [toastActive, setToastActive] = useState(false)

  const isLoading = navigation.state === 'submitting'

  useEffect(() => {
    const hasSuccessFlag = new URLSearchParams(location.search).get('success') === 'true'
    if (hasSuccessFlag) {
      setToastActive(true)
      // Remove ?success=true from the URL
      const newUrl = location.pathname
      window.history.replaceState(null, '', newUrl)
      // Clear form
      setTitle('')
      setDescriptionHtml('')
    }
  }, [location.key])

  const toggleToast = () => setToastActive(false)

  return (
    <Frame>
      <Page title="Create Product">
        <Form method="post">
          <Layout>
            <Layout.Section>
              <BlockStack gap="400">
                <TextField
                  name="title"
                  label="Product Title"
                  value={title}
                  onChange={setTitle}
                  autoComplete="off"
                  required
                />

                <TextField
                  name="descriptionHtml"
                  label="Product Description"
                  value={descriptionHtml}
                  onChange={setDescriptionHtml}
                  multiline={4}
                  required
                />

                <Button submit variant="primary" loading={isLoading}>
                  {isLoading ? 'Creating…' : 'Create Product'}
                </Button>

                {actionData?.errors &&
                  actionData.errors.map((err, i) => (
                    <Text key={i} as="p" tone="critical">
                      {err.message}
                    </Text>
                  ))}
              </BlockStack>
            </Layout.Section>
          </Layout>
        </Form>

        {toastActive && (
          <Toast content="Product created successfully" onDismiss={toggleToast} />
        )}
      </Page>
    </Frame>
  )
}
