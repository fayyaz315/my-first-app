// ✅ app.routes.app.products.tsx
import {
  json,
  LoaderFunction,
  ActionFunction,
} from '@remix-run/node'
import {
  useLoaderData,
  useFetcher,
  useSearchParams,
  Form,
} from '@remix-run/react'
import {
  Page,
  Layout,
  Modal,
  TextField,
  Button,
  BlockStack,
  Toast,
  Frame,
  Text,
  InlineStack,
  Badge,
  Select,
  Box,
  Grid,
} from '@shopify/polaris'
import { useState, useEffect } from 'react'
import { getProducts } from '../utils/shopifyQueries'
import { authenticate } from '../shopify.server'
import {
  PRODUCT_UPDATE_MUTATION,
  PRODUCT_DELETE_MUTATION,
} from '../utils/shopifyQueries'
import { ProductCard } from '../components/ProductCard'

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const searchQuery = url.searchParams.get('q') || ''
  const after = url.searchParams.get('after') || null
  const productsData = await getProducts(request, searchQuery, after)
  return json({ ...productsData, searchQuery })
}

export const action: ActionFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request)
  const formData = await request.formData()
  const actionType = formData.get('actionType')

  if (actionType === 'update') {
    const id = formData.get('id')
    const title = formData.get('title')
    const descriptionHtml = formData.get('descriptionHtml')
    const status = formData.get('status')

    if (
      typeof id !== 'string' ||
      typeof title !== 'string' ||
      typeof descriptionHtml !== 'string' ||
      typeof status !== 'string'
    ) {
      return json({ success: false, errors: [{ message: 'Invalid input' }] }, { status: 400 })
    }

    const response = await admin.graphql(PRODUCT_UPDATE_MUTATION, {
      variables: {
        input: {
          id,
          title,
          descriptionHtml,
          status,
        },
      },
    })

    const data = await response.json()
    const errors = data?.data?.productUpdate?.userErrors || []

    return json({ success: errors.length === 0, errors })
  }

  if (actionType === 'delete') {
    const id = formData.get('id')
    if (typeof id !== 'string') {
      return json({ success: false, errors: [{ message: 'Invalid ID' }] })
    }

    const response = await admin.graphql(PRODUCT_DELETE_MUTATION, {
      variables: { input: { id } },
    })

    const data = await response.json()
    const errors = data?.data?.productDelete?.userErrors || []

    return json({ success: errors.length === 0, errors })
  }

  return json({ success: false, errors: [{ message: 'Unknown action' }] })
}

export default function ProductsPage() {
  const { products, hasNextPage, endCursor, searchQuery } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const [searchParams, setSearchParams] = useSearchParams()

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [toastActive, setToastActive] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [search, setSearch] = useState(searchQuery || '')

  const isUpdating = fetcher.state === 'submitting'

  const openEditModal = (product: any) => {
    setSelectedProduct(product)
    setTitle(product.title)
    setDescriptionHtml(product.descriptionHtml || '')
    setStatus(product.status || 'ACTIVE')
    setModalOpen(true)
  }

  const openDeleteModal = (product: any) => {
    setSelectedProduct(product)
    setDeleteModalOpen(true)
  }

  const handleUpdate = () => {
    fetcher.submit(
      {
        actionType: 'update',
        id: selectedProduct.id,
        title,
        descriptionHtml,
        status,
      },
      { method: 'post' }
    )
    setModalOpen(false)
  }

  const handleDelete = () => {
    fetcher.submit(
      {
        actionType: 'delete',
        id: selectedProduct.id,
      },
      { method: 'post' }
    )
    setDeleteModalOpen(false)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ q: search })
  }

  const loadMore = () => {
    const params = Object.fromEntries(searchParams.entries())
    params.after = endCursor
    setSearchParams(params)
  }

  useEffect(() => {
    if (fetcher.data?.success) {
      setToastMessage('Operation successful')
      setToastActive(true)
    } else if (fetcher.data?.errors?.length > 0) {
      setToastMessage('Operation failed')
      setToastActive(true)
    }
  }, [fetcher.data])

  return (
    <Frame>
      <Page
        title="All Products"
        primaryAction={{ content: 'Create Product', url: '/app/create-product' }}
      >
        <Form onSubmit={handleSearchSubmit} method="get">
          <InlineStack align="start" gap="400" padding="400">
            <TextField
              label="Search by title"
              value={search}
              onChange={setSearch}
              autoComplete="off"
              placeholder="Enter product title"
              name="q"
              labelHidden
            />
            <Button submit>Search</Button>
          </InlineStack>
        </Form>

        <Box paddingBlockStart="400">
          <Layout>
            {products.map(product => (
              <Layout.Section key={product.id}>
                <ProductCard
                  product={product}
                  onEdit={() => openEditModal(product)}
                  onDelete={() => openDeleteModal(product)}
                />
              </Layout.Section>
            ))}
          </Layout>
        </Box>

        {hasNextPage && (
          <Box paddingBlockStart="400" paddingInlineStart="400">
            <Button onClick={loadMore}>Load More</Button>
          </Box>
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Edit Product"
          primaryAction={{ content: isUpdating ? 'Saving…' : 'Save', onAction: handleUpdate, loading: isUpdating }}
          secondaryActions={[{ content: 'Cancel', onAction: () => setModalOpen(false) }]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <TextField label="Title" value={title} onChange={setTitle} />
              <TextField label="Description" value={descriptionHtml} onChange={setDescriptionHtml} multiline={4} />
              <Select
                label="Status"
                options={[
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Draft', value: 'DRAFT' },
                ]}
                value={status}
                onChange={setStatus}
              />
            </BlockStack>
          </Modal.Section>
        </Modal>

        <Modal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Confirm Delete"
          primaryAction={{ content: 'Delete', destructive: true, onAction: handleDelete }}
          secondaryActions={[{ content: 'Cancel', onAction: () => setDeleteModalOpen(false) }]}
        >
          <Modal.Section>
            <Text as="p">Are you sure you want to delete "{selectedProduct?.title}"?</Text>
          </Modal.Section>
        </Modal>

        {toastActive && <Toast content={toastMessage} onDismiss={() => setToastActive(false)} />}
      </Page>
    </Frame>
  )
}
