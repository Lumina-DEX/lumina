export const isBetween = (min: number, max: number) => (value: number) => {
	return value >= min && value <= max
}
