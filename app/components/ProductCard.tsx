import {
  Card,
  Thumbnail,
  BlockStack,
  Text,
  Button,
  InlineStack,
} from '@shopify/polaris'

export function ProductCard({ product, onEdit }) {
  const image = product.featuredImage

  return (
    <Card>
      <BlockStack gap="300" padding="400">
        <InlineStack align="space-between">
          <Text as="h2" variant="headingSm">
            {product.title}
          </Text>
          <Button size="slim" onClick={onEdit}>
            Edit
          </Button>
        </InlineStack>

        {image && (
          <Thumbnail
            source={image.url}
            alt={image.altText || product.title}
            size="large"
          />
        )}

        <Text as="p" variant="bodyMd">
          {product.description || 'No description provided'}
        </Text>

        <Text as="p" variant="bodyMd">
          <strong>Price:</strong> ${product.variants.edges[0].node.price}
        </Text>
      </BlockStack>
    </Card>
  )
}
