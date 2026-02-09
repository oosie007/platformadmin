import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RatingData } from '../types/rating';
@Injectable({
  providedIn: 'root',
})
export class QuestionRatingService {
  private selectedRatingFactorsSubject = new BehaviorSubject<RatingData[]>([]);
  selectedRatingFactors$: Observable<RatingData[]> = this.selectedRatingFactorsSubject.asObservable();

  // Initialize the selectedRatingFactors array when the service is created
  constructor() {
    const initialSelectedRatingFactors = this.loadSelectedRatingFactorsFromStorage();
    this.selectedRatingFactorsSubject.next(initialSelectedRatingFactors);
  }

  updateSelectedRatingFactors(selectedRatingFactors: RatingData[]): void {
    this.selectedRatingFactorsSubject.next(selectedRatingFactors);
    // Save the selectedRatingFactors to local storage or any other storage mechanism
    this.saveSelectedRatingFactorsToStorage(selectedRatingFactors);
  }

  getSelectedRatingFactors(): Observable<RatingData[]> {
    return this.selectedRatingFactors$;
  }

  // Load selectedRatingFactors from storage (e.g., local storage)
  private loadSelectedRatingFactorsFromStorage(): RatingData[] {
    const storedValue = localStorage.getItem('selectedRatingFactors');
    if (storedValue !== null) {
      return JSON.parse(storedValue);
    } else {
      return [];
    }
  }

  // Save selectedRatingFactors to storage (e.g., local storage)
  private saveSelectedRatingFactorsToStorage(selectedRatingFactors: RatingData[]): void {
    localStorage.setItem('selectedRatingFactors', JSON.stringify(selectedRatingFactors));
  }
}

// // shared.service.ts

// import { Injectable } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root',
// })
// export class SharedService {
//   private selectedRatingFactorsSubject = new BehaviorSubject<any[]>([]);
//   selectedRatingFactors$: Observable<any[]> = this.selectedRatingFactorsSubject.asObservable();

//   updateSelectedRatingFactors(selectedRatingFactors: any[]): void {
//     this.selectedRatingFactorsSubject.next(selectedRatingFactors);
//   }

//   getSelectedRatingFactors(): Observable<any[]> {
//     return this.selectedRatingFactors$;
//   }
// }
