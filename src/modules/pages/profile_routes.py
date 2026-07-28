


@profile_router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db:Annotated[Session, Depends(get_db)]):
    result = db.execute(
        select(models.User).where(models.User.user_id== user_id)
    )
    user = result.scalars().first()

    if user:
        return user
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")