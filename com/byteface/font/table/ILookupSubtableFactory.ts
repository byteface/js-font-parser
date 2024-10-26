// UNTESTED

import { ByteArray } from "../utils/ByteArray";
import { LookupSubtable } from "./LookupSubtable";

export interface ILookupSubtableFactory {
	    
		/**
		 * 
		 * @param type
		 * @param byte_ar
		 * @param offset
		 * @return 
		 * 
		 */		
	    read(type:number, byte_ar:ByteArray, offset:number):LookupSubtable;
		
		
}
