from django.conf.urls import url

from . import views

urlpatterns = [
	url(r'^$', views.SearchView.as_view(), name='index'),
    url(r'^results/', views.ResultsView.as_view(), name='results'),  
]