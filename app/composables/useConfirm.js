import { useConfirmStore } from '~/stores/confirm'

export const useConfirm = () => {
  const store = useConfirmStore()

  const ask = (title, message, options = {}) => {
    return store.open({
      title,
      message,
      ...options
    })
  }

  return { ask }
}