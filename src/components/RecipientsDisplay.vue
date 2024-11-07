<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, Teleport } from 'vue'
import RecipientsBadge from './RecipientsBadge.vue'

// Types
interface RecipientsDisplayProps {
  recipients: string[]
}

// Props
const props = defineProps<RecipientsDisplayProps>()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const showTooltip = ref(false)

// Create reusable hidden span for text measurements
const createHiddenSpan = () => {
  const span = document.createElement('span')
  span.style.cssText = `
    visibility: hidden;
    position: absolute;
    white-space: nowrap;
  `
  document.body.appendChild(span)
  return span
}

// Computed
const visibleRecipients = ref<string[]>([])
const hiddenCount = computed(() => 
  visibleRecipients.value.length === 0 
    ? props.recipients.length - 1 
    : props.recipients.length - visibleRecipients.value.length
)

const shouldShowBadge = computed(() => 
  props.recipients.length > 1 && hiddenCount.value > 0
)

const firstRecipient = computed(() => 
  props.recipients[0] || ''
)

// Text measurement utilities
const measurementSpan = createHiddenSpan()

const measureText = (text: string): number => {
  measurementSpan.textContent = text
  return measurementSpan.offsetWidth
}

const textFits = (text: string, containerWidth: number): boolean => 
  measureText(text) <= containerWidth - 50

// Core logic
const calculateVisibleRecipients = (
  recipients: string[], 
  containerWidth: number
): string[] => {
  // Handle edge cases
  if (recipients.length === 0) return []
  if (recipients.length === 1) return [recipients[0]]
  
  const [first, ...others] = recipients
  
  // Check if even first recipient fits
  if (!textFits(first, containerWidth)) return []
  
  // Initialize with first recipient
  const visible = [first]
  let currentText = first
  
  // Add recipients until we run out of space
  for (const recipient of others) {
    const testText = `${currentText}, ${recipient}, ...`
    if (!textFits(testText, containerWidth)) break
    
    visible.push(recipient)
    currentText = `${currentText}, ${recipient}`
  }
  
  return visible
}

const updateVisibleRecipients = async () => {
  await nextTick()
  
  if (!containerRef.value) return
  
  const containerWidth = containerRef.value.offsetWidth
  visibleRecipients.value = calculateVisibleRecipients(
    props.recipients,
    containerWidth
  )
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', updateVisibleRecipients)
  updateVisibleRecipients()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateVisibleRecipients)
  measurementSpan.remove()
})
</script>

<template>
  <div 
    ref="containerRef" 
    class="recipients-container"
  >
    <span class="recipients-text">
      <span 
        v-if="!visibleRecipients.length && recipients.length" 
        class="truncated-recipient"
      >
        {{ firstRecipient }}
      </span>
      
      <span v-else>
        {{ visibleRecipients.join(', ') }}<span v-if="visibleRecipients.length < recipients.length">, ...</span>
      </span>
    </span>

    <RecipientsBadge
      v-if="shouldShowBadge"
      :numTruncated="hiddenCount"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    />

    <Teleport to="body">
      <div 
        v-if="showTooltip"
        class="recipients-tooltip"
      >
        {{ recipients.join(', ') }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.recipients-container {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  justify-content: space-between;
}

.recipients-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.truncated-recipient {
  overflow: hidden;
  text-overflow: ellipsis;
}

.recipients-tooltip {
  position: fixed;
  top: 8px;
  right: 8px;
  padding: 8px 16px;
  background-color: #666;
  color: #f0f0f0;
  border-radius: 24px;
  display: flex;
  align-items: center;
  z-index: 1000;
}
</style>