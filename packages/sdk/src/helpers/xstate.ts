import {
	type AnyEventObject,
	type CallbackLogicFunction,
	type EventObject,
	fromCallback as xstateFromCallback,
	type NonReducibleUnknown
} from "xstate"

export function fromCallback<
	TReceive extends EventObject = AnyEventObject,
	TSendBack extends EventObject = AnyEventObject,
	TInput = NonReducibleUnknown,
	TEmitted extends EventObject = EventObject
>(callback: CallbackLogicFunction<TReceive, TSendBack, TInput, TEmitted>) {
	return xstateFromCallback(callback)
}
