import { Pipe, PipeTransform } from '@angular/core';
/*
 * Converts hash to shorter one
*/
@Pipe({ name: 'hashbeauty' })
export class HashBeautyPipe implements PipeTransform {
    transform(value: string, args: string[]): any {
        if (value == null) return null;
        return value.slice(0, 6) + '...' + value.slice(-4).slice(0, 3);
    }
}