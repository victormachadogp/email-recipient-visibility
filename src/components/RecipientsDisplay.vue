<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import RecipientsBadge from './RecipientsBadge.vue'

interface RecipientsDisplayProps {
  recipients: string[]
}

const props = defineProps<RecipientsDisplayProps>()

// Refs para elementos DOM
const containerRef = ref<HTMLDivElement | null>(null)
const recipientsRef = ref<HTMLSpanElement | null>(null)
const showTooltip = ref(false)

// Estado para controle de recipients visíveis
const visibleRecipients = ref<string[]>([])

// Computed para recipients realmente escondidos (não visíveis)
const hiddenRecipients = computed(() => {
  const [_, ...rest] = props.recipients
  return rest.slice(visibleRecipients.value.length - (visibleRecipients.value[0] ? 1 : 0))
})

const hiddenCount = computed(() => hiddenRecipients.value.length)

// Verifica se texto cabe no container
// Função para reutilizar span para medir largura do texto
let span: HTMLSpanElement | null = null
const textFits = (text: string, containerWidth: number): boolean => {
  if (!span) {
    span = document.createElement('span')
    span.style.visibility = 'hidden'
    span.style.position = 'absolute'
    span.style.whiteSpace = 'nowrap'
    document.body.appendChild(span)
  }
  span.textContent = text
  const fits = span.offsetWidth <= containerWidth
  return fits
}

// Atualiza recipients visíveis baseado no espaço disponível
const updateVisibleRecipients = async () => {
  await nextTick()
  
  if (!containerRef.value || props.recipients.length === 0) return
  
  const containerWidth = containerRef.value.offsetWidth
  const [firstRecipient, ...otherRecipients] = props.recipients
  
  // Caso especial para primeiro recipient
  if (props.recipients.length === 1) {
    visibleRecipients.value = [firstRecipient]
    return
  }
  
  // Se nem o primeiro recipient cabe completamente
  if (!textFits(firstRecipient, containerWidth - 50)) {
    visibleRecipients.value = []
    return
  }
  
  const visible = [firstRecipient]
  let currentText = firstRecipient
  
  // Tenta adicionar outros recipients
  for (const recipient of otherRecipients) {
    const testText = `${currentText}, ${recipient}, ...`
    if (textFits(testText, containerWidth - 50)) {
      visible.push(recipient)
      currentText = `${currentText}, ${recipient}`
    } else {
      break
    }
  }
  
  visibleRecipients.value = visible
}

// Watch para mudanças no tamanho da janela
onMounted(() => {
  window.addEventListener('resize', updateVisibleRecipients)
  updateVisibleRecipients()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateVisibleRecipients)
})
</script>

<template>
  <div 
    ref="containerRef" 
    class="recipients-container"
    style="display: flex; align-items: center; gap: 8px;"
  >
    <span ref="recipientsRef" class="recipients-text">
      <!-- Caso especial para primeiro recipient quando não há espaço -->
      <template v-if="visibleRecipients.length === 0 && recipients.length > 0">
        <span class="truncated-recipient">{{ recipients[0] }}</span>
      </template>
      
      <!-- Recipients visíveis -->
      <template v-else>
        {{ visibleRecipients.join(', ') }}
        <template v-if="visibleRecipients.length < recipients.length">, ...</template>
      </template>
    </span>

    <!-- RecipientsBadge com contador -->
    <RecipientsBadge
      v-if="recipients.length > 1 && hiddenCount > 0"
      :numTruncated="hiddenCount"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    />

    <!-- Tooltip -->
    <div 
      v-if="showTooltip && hiddenRecipients.length > 0"
      class="recipients-tooltip"      
    >
      {{ hiddenRecipients.join(', ') }}
    </div>
  </div>
</template>

<style scoped>
.recipients-container {
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
}
</style>