import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { UserService} from './../../shared/services/user.service';
import { FormControl, Validators, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  public formGroup: FormGroup;
  private userDetails;

  imageUrl = 'assets/img/profile.png';
  public fileToUpload: File;

  // tslint:disable-next-line:max-line-length
  emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  constructor(private userService: UserService,
              private router: Router) { }

  ngOnInit() {
    this.getUserProfile();
    this.setFormGroupInstanceon();
  }

  getUserProfile() {
    this.userService.getUserProfile().subscribe(
      res => {
        // tslint:disable-next-line:no-string-literal
        this.userDetails = res['user'];
        this.setUser(this.userDetails);
      },
      err => {
        console.log(err);

      }
    );
  }

  onLogout() {
    this.userService.deleteToken();
    this.router.navigate(['/login']);
  }

  // create form...
  setFormGroupInstanceon() {
    this.formGroup = new FormGroup({
      firstname: new FormControl('', [
        Validators.required,
        Validators.pattern('[a-zA-Z ]*')
      ]),
      lastname: new FormControl('', [
        Validators.required,
        Validators.pattern('[a-zA-Z ]*')
      ]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern('[0-9]*'),
        Validators.minLength(10)
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.pattern(this.emailRegex)
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8)
      ]),
      avaterFile: new FormControl(
        null
      )
    });
  }

  // for validations...
  get firstname() { return this.formGroup.get('firstname'); }
  get lastname() { return this.formGroup.get('lastname'); }
  get phone() { return this.formGroup.get('phone'); }
  get email() { return this.formGroup.get('email'); }
  get password() { return this.formGroup.get('password'); }
  get avaterFile() { return this.formGroup.get('avaterFile'); }

  private setUser(userDetails) {
    this.formGroup.patchValue({
      firstname: userDetails.firstName,
      lastname: userDetails.lastName,
      phone: userDetails.phoneNo,
      email: userDetails.email
    });
  }

  onFileInput(fileInput: any, ): void {
    if (fileInput.target.files && fileInput.target.files[0]) {
      const reader = new FileReader();
      this.fileToUpload = fileInput.target.files[0];
      reader.onload = (event: any) => {
        this.imageUrl = event.target.result;
      };
      reader.readAsDataURL(fileInput.target.files[0]);
    }
  }

  onSubmit(): void {
    if (!this.formGroup.valid) {
    }
    this.router.navigate(['/']);
  }

}
