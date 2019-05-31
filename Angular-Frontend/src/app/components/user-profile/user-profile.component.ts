import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
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

  // tslint:disable-next-line:max-line-length
  emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  constructor(private router: Router,
              private toastr: ToastrService,
              private httpClient: HttpClient,
              private userService: UserService) { }

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
      // password: new FormControl('', [
      //   Validators.required,
      //   Validators.minLength(8)
      // ]),
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
  // get password() { return this.formGroup.get('password'); }
  get avaterFile() { return this.formGroup.get('avaterFile'); }

  private setUser(userDetails) {
    this.formGroup.patchValue({
      firstname: userDetails.firstName,
      lastname: userDetails.lastName,
      phone: userDetails.phoneNo,
      email: userDetails.email
    });
  }

  // onFileInput(fileInput: any, ): void {
  //   if (fileInput.target.files && fileInput.target.files[0]) {
  //     const reader = new FileReader();
  //     this.fileToUpload = fileInput.target.files[0];
  //     reader.onload = (event: any) => {
  //       this.imageUrl = event.target.result;
  //     };
  //     reader.readAsDataURL(fileInput.target.files[0]);
  //   }
  //   this.uploadPicture();
  // }

  private uploadPicture(event) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      // tslint:disable-next-line:no-shadowed-variable
      reader.onload = (event: any) => {
        this.imageUrl = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }

    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      const file: File = fileList[0];
      const fileSize = fileList[0].size;
      const filetype = fileList[0].type;
      if (fileSize > 1024 * 1024 * 3) {
        this.toastr.error('File size should be less than 3 MB');
        return false;
      }
      if (!filetype.match('image/jpeg')) {
        this.toastr.error('Please upload only jpg files!');
        return false;
      }
      const formData: FormData = new FormData();

      formData.append('profile', file, file.name);

      const headers = new HttpHeaders();
      headers.append('Content-Type', 'multipart/form-data');
      headers.append('Accept', 'application/json');

      const uploadurl = environment.apiBaseUrl + '/uploadprofilepicture';

      this.httpClient.post(uploadurl, formData, { headers })
        .subscribe(
          (data: any) => {
            this.toastr.success('Successfully Uploaded!');          },
          error => {
            this.toastr.error('There is a Problem Uploading!');
            console.log(error);
          }
        );
    }
  }

  onSubmit(): void {
    if (!this.formGroup.valid) {
      this.toastr.error('Error!');
    } else {
      const newUserData = {
        firstName: this.firstname.value,
        lastName: this.lastname.value,
        phoneNo: this.phone.value,
        email: this.email.value
      };
      this.userService.changeUserProfile(newUserData).subscribe(
        res => {
          this.toastr.success('Successfully Updated!');
        },
        err => {
          console.log(err);
        }
      );
    }
  }

}
