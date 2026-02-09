import { Pipe, PipeTransform } from '@angular/core';
import { isNullOrUndefined, isEmptyArray, isEmptyObject } from 'is-what';

@Pipe({
  standalone: true,
  name: 'inputUnselect',
})
export class inputUnselectPipe implements PipeTransform {
  transform(values: any[]): any[] {
    if(isNullOrUndefined(values) || isEmptyArray(values) || isEmptyObject(values))
      return values;
    else
    return [' ', ...values];
  }
}
