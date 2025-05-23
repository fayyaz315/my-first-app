import {
  json,
  LoaderFunction,
  ActionFunction,
} from '@remix-run/node'
import {
  useLoaderData,
  useFetcher,
} from '@remix-run/react'
import {
  Page,
  Layout,
  Modal,
  TextField,
  Button,
  BlockStack,
  Toast,
  Frame
} from '@shopify/polaris'
import { useState, useEffect } from 'react'
import { getProducts } from '../utils/shopifyQueries'
import { authenticate } from '../shopify.server'
import { PRODUCT_UPDATE_MUTATION } from '../utils/shopifyQueries'
import { ProductCard } from '../components/ProductCard'

export const loader: LoaderFunction = async ({ request }) => {
  const products = await getProducts(request)
  return json({ products })
}

export const action: ActionFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request)
  const formData = await request.formData()

  const id = formData.get('id')
  const title = formData.get('title')
  const descriptionHtml = formData.get('descriptionHtml')

  if (typeof id !== 'string' || typeof title !== 'string' || typeof descriptionHtml !== 'string') {
    return json({ success: false, errors: [{ message: 'Invalid input' }] }, { status: 400 })
  }

  const response = await admin.graphql(PRODUCT_UPDATE_MUTATION, {
    variables: {
      input: {
        id,
        title,
        descriptionHtml,
      },
    },
  })

  const data = await response.json()
  const errors = data?.data?.productUpdate?.userErrors || []

  return json({ success: errors.length === 0, errors })
}

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')

  const [toastActive, setToastActive] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const isUpdating = fetcher.state === 'submitting'

  const openEditModal = (product: any) => {
    setSelectedProduct(product)
    setTitle(product.title)
    setDescriptionHtml(product.descriptionHtml || '')
    setModalOpen(true)
  }

  const handleUpdate = () => {
    fetcher.submit(
      {
        id: selectedProduct.id,
        title,
        descriptionHtml,
      },
      {
        method: 'post',
      }
    )
    setModalOpen(false)
  }

  useEffect(() => {
    if (fetcher.data?.success) {
      setToastMessage('Product updated successfully')
      setToastActive(true)
    } else if (fetcher.data?.errors?.length > 0) {
      setToastMessage('Failed to update product')
      setToastActive(true)
    }
  }, [fetcher.data])

  return (
    <Frame>
    <Page
      title="All Products"
      primaryAction={{
        content: 'Create Product',
        url: '/app/create-product',
      }}
    >
      <Layout>
        {products.map(product => (
          <Layout.Section key={product.id}>
            <ProductCard product={product} onEdit={() => openEditModal(product)} />
          </Layout.Section>
        ))}
      </Layout>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Product"
        primaryAction={{
          content: isUpdating ? 'Saving…' : 'Save',
          onAction: handleUpdate,
          loading: isUpdating,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField label="Title" value={title} onChange={setTitle} />
            <TextField
              label="Description"
              value={descriptionHtml}
              onChange={setDescriptionHtml}
              multiline={4}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      {toastActive && (
        <Toast content={toastMessage} onDismiss={() => setToastActive(false)} />
      )}
    </Page>
    </Frame>
  )
}
