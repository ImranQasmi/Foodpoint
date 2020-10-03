import { Component,OnInit,ViewChild,Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Dish } from '../shared/dish';
// import { DISHES } from '../shared/dishes';

import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { Console } from 'console';

import { Comment } from '../shared/comment';
import { from } from 'rxjs';
import { flyInOut,expand } from '../animations/app.animation';
import { visibility } from '../animations/app.animation';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
    },
    animations: [
      visibility(),
      flyInOut(),
      expand()
    ]
})

export class DishdetailComponent implements OnInit {

  todayString : string = new Date().toDateString();

  @ViewChild('cform') commentFormDirective;

  commentForm: FormGroup;
  comment: Comment;
  
  dishcopy: Dish;

  dish : Dish;
  errMess: string;
  dishIds: string[];
  prev: string;
  next: string;

  visibility = 'shown';

  formErrors = {
    'rating': '',
    'comment': '',
    'author': '',
  };

  validationMessages = {
    'author': {
      'required':      'author Name is required.',
      'minlength':     'author Name must be at least 2 characters long.'
    },
    'comment': {
      'required':      'comment is required.',
    },
  };
  
  constructor(
    private dishservice: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL') private BaseURL) {  }

    ngOnInit() {
      this.createForm()

      this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
      this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishservice.getDish(params['id']);}))
      .subscribe(dish => { this.dish = dish;  this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
      errmess => this.errMess = <any>errmess );
    }

    setPrevNext(dishId: string) {
      const index = this.dishIds.indexOf(dishId);
      this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
      this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
    }

    createForm() {
      this.commentForm = this.fb.group({
        author: ['', [Validators.required, Validators.minLength(2)] ],
        rating: [, Validators.required ],
        comment: ['', Validators.required ],
        date:'' 
      });
  
      this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));
  
    this.onValueChanged();
  
    }

    onValueChanged(data?: any) {
      if (!this.commentForm) { return; }
      const form = this.commentForm;
      for (const field in this.formErrors) {
        if (this.formErrors.hasOwnProperty(field)) {
          // clear previous error message (if any)
          this.formErrors[field] = '';
          const control = form.get(field);
          if (control && control.dirty && !control.valid) {
            const messages = this.validationMessages[field];
            for (const key in control.errors) {
              if (control.errors.hasOwnProperty(key)) {
                this.formErrors[field] += messages[key] + ' ';
              }
            }
          }
        }
      }
    }

    onSubmit() {
      // this.commentForm.value.date = this.todayString;
      // this.dish.comments.push(this.commentForm.value);
      this.comment = this.commentForm.value;
      this.comment.date = new Date().toISOString();
      this.dishcopy.comments.push(this.comment);
      this.dishservice.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
      this.commentForm.reset({
        author: '',
        rating: '5',
        comment: '',
        date:''
      });
      // this.commentFormDirective.resetForm({rating: 5});
    }

  goBack(): void {
    this.location.back();
  }
}
