import { useDispatch, useSelector, useStore } from 'react-redux';
import type { store } from './store';


export type TAppStore = typeof store
export type TRootState = ReturnType<TAppStore['getState']>
export type TAppDispatch = TAppStore['dispatch']

export const useAppDispatch = useDispatch.withTypes<TAppDispatch>()
export const useAppSelector = useSelector.withTypes<TRootState>()
export const useAppStore = useStore.withTypes<TAppStore>()
