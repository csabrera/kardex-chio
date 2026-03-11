import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export const showSuccess = (message: string) => {
  Toast.fire({ icon: 'success', title: message });
};

export const showError = (message: string) => {
  Toast.fire({ icon: 'error', title: message });
};

export const showWarning = (message: string) => {
  Toast.fire({ icon: 'warning', title: message });
};

export const showInfo = (message: string) => {
  Toast.fire({ icon: 'info', title: message });
};

export const confirmDelete = async (itemName: string = 'este registro'): Promise<boolean> => {
  const result = await Swal.fire({
    title: '¿Está seguro?',
    text: `Se eliminará ${itemName}. Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  });
  return result.isConfirmed;
};

export const confirmAction = async (title: string, text: string): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
  });
  return result.isConfirmed;
};

export default Swal;
