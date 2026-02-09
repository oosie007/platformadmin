import { Injectable } from '@angular/core';
import { ReactiveFieldConfig } from '@canvas/components';
import { Subject } from 'rxjs';
import { MasterData } from '../types/product';

@Injectable({ providedIn: 'root' })
export class SharedService {
  nextButtonClicked = new Subject();
  previousButtonClicked = new Subject();

  getNextButtonClicked() {
    return this.nextButtonClicked.asObservable();
  }

  getPreviousButtonClicked() {
    return this.previousButtonClicked.asObservable();
  }

  _bindDomainData(
    formConfig: Array<ReactiveFieldConfig>,
    bindDomainData: MasterData[],
    control: string,
    valueKey: string,
    labelKey: string
  ) {
    formConfig.forEach((config) => {
      if (config.control === control) {
        config.options = bindDomainData.map((res: MasterData) => ({
          value: (res[valueKey as keyof MasterData] as string) ?? '',
          label: (res[labelKey as keyof MasterData] as string) ?? '',
        }));
      }
    });
  }
}
