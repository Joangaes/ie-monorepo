from django import forms
from django.contrib.auth.forms import (
    PasswordResetForm as DjangoPasswordResetForm,
    SetPasswordForm as DjangoSetPasswordForm,
)
from unfold.widgets import UnfoldAdminEmailInputWidget, UnfoldAdminPasswordInput


class PasswordResetForm(DjangoPasswordResetForm):
    """Custom Password Reset Form styled with django-unfold."""

    email = forms.EmailField(
        max_length=254,
        widget=UnfoldAdminEmailInputWidget(
            attrs={
                "placeholder": "Enter your email address",
            }
        ),
        label="Email Address",
    )


class SetPasswordForm(DjangoSetPasswordForm):
    """Custom Set Password Form styled with django-unfold."""

    new_password1 = forms.CharField(
        widget=UnfoldAdminPasswordInput(
            attrs={
                "placeholder": "Enter new password",
            }
        ),
        label="New Password",
    )
    new_password2 = forms.CharField(
        widget=UnfoldAdminPasswordInput(
            attrs={
                "placeholder": "Confirm new password",
            }
        ),
        label="Confirm Password",
    )
