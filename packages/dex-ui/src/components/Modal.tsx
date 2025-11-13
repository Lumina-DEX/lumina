interface ModalProps {
	children: React.ReactNode
	onClose: () => void
	title: string
}

export function Modal({ children, onClose, title }: ModalProps) {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg max-w-md w-full p-6">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-xl font-semibold">{title}</h3>
					<button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>
				{children}
			</div>
		</div>
	)
}
